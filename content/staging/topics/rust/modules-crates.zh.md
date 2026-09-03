---
title: Rust 模块与包
description: 深入理解 Rust 模块系统和包管理，组织大型项目代码
track: rust
section: basics
difficulty: intermediate
tags:
  - Rust
  - 模块
  - 包
  - 组织
status: imported
origin: old/src/content/docs/rust/modules-crates.zh.md
divergence: 0.223
issues:
  - title-lang-en
  - title-language
legacy:
  category: Rust
  subcategory: 核心概念
  order: 18
  lastUpdated: 2026-01-07
---

Rust 的模块系统是组织代码的核心机制，它帮助开发者管理代码的可见性、命名空间和代码复用。本文将深入探讨 Rust 的模块（modules）、包（crates）和工作空间（workspaces），帮助你掌握大型项目的代码组织技巧。

## 模块系统概述

Rust 的模块系统由以下几个核心概念组成：

- **包（Crate）**：编译的最小单位，可以是二进制程序或库
- **包管理器包（Package）**：包含一个或多个 crate 的 Cargo 项目
- **模块（Module）**：组织代码和控制可见性的命名空间
- **路径（Path）**：引用模块中项目的方式

## mod 关键字

`mod` 关键字用于定义模块。模块可以包含函数、结构体、枚举、常量、trait 以及其他模块。

### 内联模块

最简单的方式是在同一个文件中定义模块：

```rust
// 定义一个名为 garden 的模块
mod garden {
    // 模块内的公开函数
    pub fn plant_seed() {
        println!("种下一颗种子");
    }

    // 私有函数，只能在模块内部访问
    fn water() {
        println!("浇水");
    }

    // 嵌套模块
    pub mod vegetables {
        pub fn harvest_tomato() {
            println!("收获番茄");
        }
    }
}

fn main() {
    // 使用绝对路径调用
    crate::garden::plant_seed();

    // 使用相对路径调用
    garden::vegetables::harvest_tomato();

    // 这会编译错误，water 是私有的
    // garden::water();
}
```

### 文件模块

当模块代码较多时，可以将其放在单独的文件中：

```rust
// src/main.rs 或 src/lib.rs
mod garden;  // 声明模块，Rust 会查找 src/garden.rs 或 src/garden/mod.rs

fn main() {
    garden::plant_seed();
}
```

```rust
// src/garden.rs
pub fn plant_seed() {
    println!("种下一颗种子");
}
```

### 目录模块

对于包含子模块的复杂模块，可以使用目录结构：

```
src/
├── main.rs
└── garden/
    ├── mod.rs        // 模块入口（旧风格）
    ├── vegetables.rs
    └── fruits.rs
```

或者使用新风格（Rust 2018+）：

```
src/
├── main.rs
├── garden.rs         // 模块入口（新风格）
└── garden/
    ├── vegetables.rs
    └── fruits.rs
```

```rust
// src/garden.rs
pub mod vegetables;  // 声明子模块
pub mod fruits;

pub fn overview() {
    println!("欢迎来到花园！");
}
```

```rust
// src/garden/vegetables.rs
pub fn list() {
    println!("蔬菜：番茄、黄瓜、茄子");
}
```

## pub 可见性

Rust 默认所有项目都是私有的。使用 `pub` 关键字可以控制项目的可见性。

### 基本可见性规则

```rust
mod outer {
    pub fn public_function() {
        println!("这是公开函数");
    }

    fn private_function() {
        println!("这是私有函数");
    }

    pub mod inner {
        pub fn inner_public() {
            // 可以访问父模块的私有函数
            super::private_function();
        }

        fn inner_private() {
            println!("内部私有");
        }
    }
}
```

### 结构体字段的可见性

结构体的字段默认是私有的，即使结构体本身是公开的：

```rust
mod restaurant {
    pub struct Breakfast {
        pub toast: String,      // 公开字段
        seasonal_fruit: String, // 私有字段
    }

    impl Breakfast {
        // 需要提供构造函数，因为有私有字段
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("桃子"),
            }
        }
    }
}

fn main() {
    let mut meal = restaurant::Breakfast::summer("黑麦面包");

    // 可以修改公开字段
    meal.toast = String::from("全麦面包");

    // 这会编译错误，seasonal_fruit 是私有的
    // meal.seasonal_fruit = String::from("蓝莓");
}
```

### 枚举的可见性

与结构体不同，公开枚举的所有变体都是公开的：

```rust
mod menu {
    pub enum Appetizer {
        Soup,      // 自动公开
        Salad,     // 自动公开
    }
}

fn main() {
    let order1 = menu::Appetizer::Soup;
    let order2 = menu::Appetizer::Salad;
}
```

### 细粒度可见性控制

Rust 提供了更精细的可见性控制：

```rust
mod outer {
    pub mod inner {
        // 只对父模块可见
        pub(super) fn parent_only() {
            println!("只有父模块能看到我");
        }

        // 只对当前 crate 可见
        pub(crate) fn crate_only() {
            println!("只有当前 crate 能看到我");
        }

        // 只对指定路径可见
        pub(in crate::outer) fn specific_path() {
            println!("只对 outer 模块可见");
        }
    }

    pub fn test() {
        inner::parent_only();     // 可以访问
        inner::crate_only();      // 可以访问
        inner::specific_path();   // 可以访问
    }
}

fn main() {
    // outer::inner::parent_only();  // 错误：不可见
    outer::inner::crate_only();      // 可以访问（在同一 crate 内）
}
```

## use 语句

`use` 关键字用于将路径引入作用域，简化代码中的路径书写。

### 基本用法

```rust
mod garden {
    pub mod vegetables {
        pub fn plant() {
            println!("种植蔬菜");
        }

        pub fn harvest() {
            println!("收获蔬菜");
        }
    }
}

// 引入模块
use garden::vegetables;

// 或者直接引入函数
use garden::vegetables::plant;

fn main() {
    vegetables::plant();  // 使用模块路径
    plant();              // 直接调用
    vegetables::harvest();
}
```

### 惯用导入风格

对于函数，通常导入其父模块：

```rust
use std::collections::HashMap;

fn main() {
    // 推荐：清晰表明 HashMap 来自哪里
    let mut map = HashMap::new();
}
```

对于结构体、枚举等，通常直接导入：

```rust
use std::collections::HashMap;
use std::io::Result;

fn main() {
    let map: HashMap<String, i32> = HashMap::new();
}
```

### 处理名称冲突

当存在同名项目时，可以使用 `as` 重命名：

```rust
use std::fmt::Result;
use std::io::Result as IoResult;

fn function1() -> Result {
    Ok(())
}

fn function2() -> IoResult<()> {
    Ok(())
}
```

或者只导入父模块：

```rust
use std::fmt;
use std::io;

fn function1() -> fmt::Result {
    Ok(())
}

fn function2() -> io::Result<()> {
    Ok(())
}
```

### 嵌套路径

可以使用嵌套路径来简化多个 `use` 语句：

```rust
// 原始写法
use std::cmp::Ordering;
use std::io;

// 嵌套写法
use std::{cmp::Ordering, io};

// 更多例子
use std::io::{self, Write, BufReader};
// 等价于：
// use std::io;
// use std::io::Write;
// use std::io::BufReader;
```

### glob 运算符

使用 `*` 可以导入模块的所有公开项目：

```rust
use std::collections::*;

fn main() {
    let mut map = HashMap::new();
    let mut set = HashSet::new();
    let mut vec = VecDeque::new();
}
```

**注意**：glob 导入可能导致命名冲突，通常只在测试模块或 prelude 模式中使用。

## 文件结构组织

### 标准项目结构

一个典型的 Rust 项目结构如下：

```
my_project/
├── Cargo.toml
├── Cargo.lock
├── src/
│   ├── main.rs      # 二进制 crate 入口
│   ├── lib.rs       # 库 crate 入口（可选）
│   ├── config.rs    # 模块
│   ├── utils/       # 模块目录
│   │   ├── mod.rs
│   │   ├── helpers.rs
│   │   └── validators.rs
│   └── bin/         # 额外的二进制文件
│       └── tool.rs
├── tests/           # 集成测试
│   └── integration_test.rs
├── benches/         # 基准测试
│   └── benchmark.rs
└── examples/        # 示例代码
    └── demo.rs
```

### 模块声明与文件对应

```rust
// src/lib.rs
pub mod config;           // 查找 src/config.rs
pub mod utils;            // 查找 src/utils.rs 或 src/utils/mod.rs

pub use config::Settings; // 重导出
```

```rust
// src/utils.rs 或 src/utils/mod.rs
pub mod helpers;          // 查找 src/utils/helpers.rs
pub mod validators;       // 查找 src/utils/validators.rs

pub fn common_utility() {
    println!("通用工具函数");
}
```

### 模块路径引用

```rust
// 在 src/utils/helpers.rs 中
use crate::config::Settings;        // 绝对路径，从 crate 根开始
use super::validators;               // 相对路径，父模块
use self::internal_module;           // 相对路径，当前模块

mod internal_module {
    pub fn helper() {}
}
```

## Crates（包）

Crate 是 Rust 编译的基本单位，分为两种类型：

### 二进制 Crate

包含 `main` 函数，可以编译成可执行文件：

```rust
// src/main.rs
fn main() {
    println!("这是一个二进制 crate");
}
```

### 库 Crate

不包含 `main` 函数，用于提供功能给其他 crate 使用：

```rust
// src/lib.rs
pub fn library_function() {
    println!("这是库函数");
}
```

### 同时包含库和二进制

一个项目可以同时包含库和二进制 crate：

```rust
// src/lib.rs
pub fn shared_function() {
    println!("共享功能");
}

// src/main.rs
use my_project::shared_function;

fn main() {
    shared_function();
}
```

### 多个二进制 Crate

```
src/
├── lib.rs
├── main.rs
└── bin/
    ├── server.rs
    └── client.rs
```

```toml
# Cargo.toml
[[bin]]
name = "server"
path = "src/bin/server.rs"

[[bin]]
name = "client"
path = "src/bin/client.rs"
```

运行特定的二进制：

```bash
cargo run --bin server
cargo run --bin client
```

### 外部依赖

在 `Cargo.toml` 中添加依赖：

```toml
[dependencies]
serde = "1.0"
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
```

使用外部 crate：

```rust
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Serialize, Deserialize)]
struct User {
    name: String,
    age: u32,
}

fn main() {
    let user = User {
        name: String::from("张三"),
        age: 30,
    };

    let json = serde_json::to_string(&user).unwrap();
    println!("{}", json);
}
```

## 工作空间（Workspaces）

工作空间用于管理多个相关的 crate，共享依赖和输出目录。

### 创建工作空间

```
my_workspace/
├── Cargo.toml          # 工作空间配置
├── shared/             # 共享库
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
├── app_one/            # 应用一
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
└── app_two/            # 应用二
    ├── Cargo.toml
    └── src/
        └── main.rs
```

### 工作空间配置

```toml
# my_workspace/Cargo.toml
[workspace]
members = [
    "shared",
    "app_one",
    "app_two",
]

# 共享的依赖版本
[workspace.dependencies]
serde = "1.0"
tokio = { version = "1", features = ["full"] }
```

```toml
# shared/Cargo.toml
[package]
name = "shared"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { workspace = true }
```

```toml
# app_one/Cargo.toml
[package]
name = "app_one"
version = "0.1.0"
edition = "2021"

[dependencies]
shared = { path = "../shared" }
tokio = { workspace = true }
```

### 工作空间操作

```bash
# 构建所有成员
cargo build

# 构建特定成员
cargo build -p app_one

# 运行特定成员
cargo run -p app_one

# 测试所有成员
cargo test

# 测试特定成员
cargo test -p shared
```

### 工作空间的优势

1. **共享编译输出**：所有 crate 共享 `target` 目录，避免重复编译
2. **统一依赖版本**：确保所有 crate 使用相同版本的依赖
3. **简化开发流程**：一个命令可以操作多个 crate
4. **本地依赖管理**：方便在开发阶段引用其他 crate

## 重导出（Re-exports）

重导出允许你创建更清晰的公共 API，隐藏内部模块结构。

### 基本重导出

```rust
// src/lib.rs
mod internal {
    pub mod deep {
        pub struct ImportantStruct {
            pub value: i32,
        }

        pub fn important_function() {
            println!("重要功能");
        }
    }
}

// 重导出，用户可以直接使用 my_crate::ImportantStruct
pub use internal::deep::ImportantStruct;
pub use internal::deep::important_function;
```

使用时：

```rust
// 不需要知道内部结构
use my_crate::ImportantStruct;
use my_crate::important_function;
```

### 创建 Prelude 模块

许多库提供 prelude 模块，包含最常用的项目：

```rust
// src/lib.rs
pub mod error;
pub mod config;
pub mod utils;

// prelude 模块，包含常用项目
pub mod prelude {
    pub use crate::error::{Error, Result};
    pub use crate::config::Config;
    pub use crate::utils::{helper1, helper2};
}
```

使用时：

```rust
use my_crate::prelude::*;

fn main() -> Result<()> {
    let config = Config::new();
    helper1();
    Ok(())
}
```

### 重命名重导出

```rust
pub use internal::LongStructName as ShortName;
pub use internal::verbose_function_name as func;
```

### 条件重导出

结合 feature flags 进行条件重导出：

```rust
#[cfg(feature = "async")]
pub use async_module::AsyncClient;

#[cfg(not(feature = "async"))]
pub use sync_module::SyncClient as Client;

#[cfg(feature = "async")]
pub use async_module::AsyncClient as Client;
```

## 实践示例：构建模块化项目

让我们构建一个完整的模块化项目示例：

```
online_store/
├── Cargo.toml
└── src/
    ├── lib.rs
    ├── models/
    │   ├── mod.rs
    │   ├── product.rs
    │   ├── user.rs
    │   └── order.rs
    ├── services/
    │   ├── mod.rs
    │   ├── inventory.rs
    │   └── payment.rs
    ├── utils/
    │   ├── mod.rs
    │   └── validation.rs
    └── error.rs
```

### 模块定义

```rust
// src/lib.rs
pub mod models;
pub mod services;
pub mod utils;
pub mod error;

// 创建 prelude
pub mod prelude {
    pub use crate::models::{Product, User, Order};
    pub use crate::services::{InventoryService, PaymentService};
    pub use crate::error::{StoreError, Result};
}
```

```rust
// src/error.rs
use std::fmt;

#[derive(Debug)]
pub enum StoreError {
    NotFound(String),
    InvalidInput(String),
    PaymentFailed(String),
}

impl fmt::Display for StoreError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            StoreError::NotFound(msg) => write!(f, "未找到: {}", msg),
            StoreError::InvalidInput(msg) => write!(f, "无效输入: {}", msg),
            StoreError::PaymentFailed(msg) => write!(f, "支付失败: {}", msg),
        }
    }
}

impl std::error::Error for StoreError {}

pub type Result<T> = std::result::Result<T, StoreError>;
```

```rust
// src/models/mod.rs
mod product;
mod user;
mod order;

pub use product::Product;
pub use user::User;
pub use order::Order;
```

```rust
// src/models/product.rs
#[derive(Debug, Clone)]
pub struct Product {
    pub id: u64,
    pub name: String,
    pub price: f64,
    inventory_count: u32,  // 私有字段
}

impl Product {
    pub fn new(id: u64, name: &str, price: f64) -> Self {
        Product {
            id,
            name: String::from(name),
            price,
            inventory_count: 0,
        }
    }

    pub fn in_stock(&self) -> bool {
        self.inventory_count > 0
    }

    pub(crate) fn set_inventory(&mut self, count: u32) {
        self.inventory_count = count;
    }

    pub(crate) fn get_inventory(&self) -> u32 {
        self.inventory_count
    }
}
```

```rust
// src/models/user.rs
#[derive(Debug, Clone)]
pub struct User {
    pub id: u64,
    pub username: String,
    email: String,  // 私有字段，需要验证
}

impl User {
    pub fn new(id: u64, username: &str, email: &str) -> crate::error::Result<Self> {
        if !crate::utils::validation::is_valid_email(email) {
            return Err(crate::error::StoreError::InvalidInput(
                "无效的邮箱地址".to_string()
            ));
        }

        Ok(User {
            id,
            username: String::from(username),
            email: String::from(email),
        })
    }

    pub fn email(&self) -> &str {
        &self.email
    }
}
```

```rust
// src/models/order.rs
use super::{Product, User};

#[derive(Debug)]
pub struct Order {
    pub id: u64,
    pub user: User,
    pub items: Vec<OrderItem>,
}

#[derive(Debug)]
pub struct OrderItem {
    pub product: Product,
    pub quantity: u32,
}

impl Order {
    pub fn new(id: u64, user: User) -> Self {
        Order {
            id,
            user,
            items: Vec::new(),
        }
    }

    pub fn add_item(&mut self, product: Product, quantity: u32) {
        self.items.push(OrderItem { product, quantity });
    }

    pub fn total(&self) -> f64 {
        self.items.iter()
            .map(|item| item.product.price * item.quantity as f64)
            .sum()
    }
}
```

```rust
// src/services/mod.rs
mod inventory;
mod payment;

pub use inventory::InventoryService;
pub use payment::PaymentService;
```

```rust
// src/services/inventory.rs
use crate::models::Product;
use crate::error::{Result, StoreError};
use std::collections::HashMap;

pub struct InventoryService {
    products: HashMap<u64, Product>,
}

impl InventoryService {
    pub fn new() -> Self {
        InventoryService {
            products: HashMap::new(),
        }
    }

    pub fn add_product(&mut self, mut product: Product, quantity: u32) {
        product.set_inventory(quantity);
        self.products.insert(product.id, product);
    }

    pub fn get_product(&self, id: u64) -> Result<&Product> {
        self.products.get(&id)
            .ok_or_else(|| StoreError::NotFound(format!("产品 ID: {}", id)))
    }

    pub fn check_availability(&self, id: u64, quantity: u32) -> Result<bool> {
        let product = self.get_product(id)?;
        Ok(product.get_inventory() >= quantity)
    }
}

impl Default for InventoryService {
    fn default() -> Self {
        Self::new()
    }
}
```

```rust
// src/services/payment.rs
use crate::models::Order;
use crate::error::{Result, StoreError};

pub struct PaymentService;

impl PaymentService {
    pub fn new() -> Self {
        PaymentService
    }

    pub fn process_payment(&self, order: &Order, amount: f64) -> Result<String> {
        if amount < order.total() {
            return Err(StoreError::PaymentFailed(
                "支付金额不足".to_string()
            ));
        }

        // 模拟支付处理
        Ok(format!("支付成功，交易ID: TXN{}", order.id))
    }
}

impl Default for PaymentService {
    fn default() -> Self {
        Self::new()
    }
}
```

```rust
// src/utils/mod.rs
pub mod validation;

pub use validation::is_valid_email;
```

```rust
// src/utils/validation.rs
pub fn is_valid_email(email: &str) -> bool {
    email.contains('@') && email.contains('.')
}

pub fn is_valid_username(username: &str) -> bool {
    username.len() >= 3 && username.chars().all(|c| c.is_alphanumeric() || c == '_')
}
```

### 使用示例

```rust
// examples/demo.rs
use online_store::prelude::*;

fn main() -> Result<()> {
    // 创建产品
    let laptop = Product::new(1, "笔记本电脑", 5999.0);
    let mouse = Product::new(2, "无线鼠标", 199.0);

    // 设置库存
    let mut inventory = InventoryService::default();
    inventory.add_product(laptop.clone(), 10);
    inventory.add_product(mouse.clone(), 50);

    // 创建用户
    let user = User::new(1, "zhangsan", "zhangsan@example.com")?;

    // 创建订单
    let mut order = Order::new(1001, user);
    order.add_item(laptop, 1);
    order.add_item(mouse, 2);

    println!("订单总额: ￥{:.2}", order.total());

    // 处理支付
    let payment = PaymentService::new();
    let result = payment.process_payment(&order, 6500.0)?;
    println!("{}", result);

    Ok(())
}
```

## 最佳实践

### 模块组织原则

- 按功能而非类型组织模块
- 保持模块职责单一
- 合理使用子模块层级，避免过深嵌套

### 可见性控制

- 默认使用私有，只公开必要的 API
- 使用 `pub(crate)` 在 crate 内部共享
- 使用 `pub(super)` 限制在父模块范围内

### 导入风格

- 函数导入其父模块
- 类型直接导入
- 避免滥用 glob 导入
- 使用 `as` 处理命名冲突

### 重导出策略

- 创建清晰的公共 API
- 使用 prelude 模块提供便捷导入
- 隐藏内部实现细节

### 工作空间使用

- 相关项目使用工作空间管理
- 统一依赖版本
- 合理划分 crate 边界

## 总结

Rust 的模块系统提供了强大而灵活的代码组织能力：

| 特性 | 用途 | 关键字/语法 |
|------|------|-------------|
| 模块 | 组织代码和命名空间 | `mod` |
| 可见性 | 控制访问权限 | `pub`, `pub(crate)`, `pub(super)` |
| 导入 | 简化路径引用 | `use`, `as` |
| 路径 | 定位项目 | `crate::`, `super::`, `self::` |
| 重导出 | 创建清晰 API | `pub use` |
| 工作空间 | 管理多 crate 项目 | `[workspace]` |

掌握这些概念，你就能够构建结构清晰、易于维护的大型 Rust 项目。模块系统不仅帮助组织代码，还通过可见性控制确保了封装性，是 Rust 安全性和可维护性的重要基石。
