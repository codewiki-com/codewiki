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
origin: old/src/content/docs/rust/modules-crates.en.md
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

Rust's module system is the core mechanism for organizing code, helping developers manage code visibility, namespaces, and code reuse. We'll cover Rust's modules, crates, and workspaces in depth to help you master code organization techniques for large projects.

## Module System Overview

Rust's module system consists of the following core concepts:

- **Crate**: The smallest unit of compilation, can be a binary program or library
- **Package**: A Cargo project containing one or more crates
- **Module**: A namespace for organizing code and controlling visibility
- **Path**: A way to reference items in modules

## The mod Keyword

The `mod` keyword is used to define modules. Modules can contain functions, structs, enums, constants, traits, and other modules.

### Inline Modules

The simplest way is to define modules in the same file:

```rust
// Define a module named garden
mod garden {
    // Public function in the module
    pub fn plant_seed() {
        println!("Planting a seed");
    }

    // Private function, only accessible within the module
    fn water() {
        println!("Watering");
    }

    // Nested module
    pub mod vegetables {
        pub fn harvest_tomato() {
            println!("Harvesting tomato");
        }
    }
}

fn main() {
    // Call using absolute path
    crate::garden::plant_seed();

    // Call using relative path
    garden::vegetables::harvest_tomato();

    // This will cause a compilation error, water is private
    // garden::water();
}
```

### File Modules

When module code is extensive, it can be placed in a separate file:

```rust
// src/main.rs or src/lib.rs
mod garden;  // Declare module, Rust will look for src/garden.rs or src/garden/mod.rs

fn main() {
    garden::plant_seed();
}
```

```rust
// src/garden.rs
pub fn plant_seed() {
    println!("Planting a seed");
}
```

### Directory Modules

For complex modules containing submodules, you can use a directory structure:

```
src/
├── main.rs
└── garden/
    ├── mod.rs        // Module entry (old style)
    ├── vegetables.rs
    └── fruits.rs
```

Or use the new style (Rust 2018+):

```
src/
├── main.rs
├── garden.rs         // Module entry (new style)
└── garden/
    ├── vegetables.rs
    └── fruits.rs
```

```rust
// src/garden.rs
pub mod vegetables;  // Declare submodule
pub mod fruits;

pub fn overview() {
    println!("Welcome to the garden!");
}
```

```rust
// src/garden/vegetables.rs
pub fn list() {
    println!("Vegetables: tomato, cucumber, eggplant");
}
```

## pub Visibility

By default, all items in Rust are private. The `pub` keyword is used to control item visibility.

### Basic Visibility Rules

```rust
mod outer {
    pub fn public_function() {
        println!("This is a public function");
    }

    fn private_function() {
        println!("This is a private function");
    }

    pub mod inner {
        pub fn inner_public() {
            // Can access parent module's private function
            super::private_function();
        }

        fn inner_private() {
            println!("Inner private");
        }
    }
}
```

### Struct Field Visibility

Struct fields are private by default, even if the struct itself is public:

```rust
mod restaurant {
    pub struct Breakfast {
        pub toast: String,      // Public field
        seasonal_fruit: String, // Private field
    }

    impl Breakfast {
        // Need to provide a constructor because of private fields
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("peach"),
            }
        }
    }
}

fn main() {
    let mut meal = restaurant::Breakfast::summer("rye bread");

    // Can modify public field
    meal.toast = String::from("whole wheat bread");

    // This will cause a compilation error, seasonal_fruit is private
    // meal.seasonal_fruit = String::from("blueberry");
}
```

### Enum Visibility

Unlike structs, all variants of a public enum are public:

```rust
mod menu {
    pub enum Appetizer {
        Soup,      // Automatically public
        Salad,     // Automatically public
    }
}

fn main() {
    let order1 = menu::Appetizer::Soup;
    let order2 = menu::Appetizer::Salad;
}
```

### Fine-grained Visibility Control

Rust provides more granular visibility control:

```rust
mod outer {
    pub mod inner {
        // Only visible to parent module
        pub(super) fn parent_only() {
            println!("Only the parent module can see me");
        }

        // Only visible to current crate
        pub(crate) fn crate_only() {
            println!("Only the current crate can see me");
        }

        // Only visible to specified path
        pub(in crate::outer) fn specific_path() {
            println!("Only visible to outer module");
        }
    }

    pub fn test() {
        inner::parent_only();     // Can access
        inner::crate_only();      // Can access
        inner::specific_path();   // Can access
    }
}

fn main() {
    // outer::inner::parent_only();  // Error: not visible
    outer::inner::crate_only();      // Can access (within same crate)
}
```

## The use Statement

The `use` keyword is used to bring paths into scope, simplifying path writing in code.

### Basic Usage

```rust
mod garden {
    pub mod vegetables {
        pub fn plant() {
            println!("Planting vegetables");
        }

        pub fn harvest() {
            println!("Harvesting vegetables");
        }
    }
}

// Import module
use garden::vegetables;

// Or import function directly
use garden::vegetables::plant;

fn main() {
    vegetables::plant();  // Use module path
    plant();              // Call directly
    vegetables::harvest();
}
```

### Idiomatic Import Style

For functions, typically import their parent module:

```rust
use std::collections::HashMap;

fn main() {
    // Recommended: clearly shows where HashMap comes from
    let mut map = HashMap::new();
}
```

For structs, enums, etc., typically import directly:

```rust
use std::collections::HashMap;
use std::io::Result;

fn main() {
    let map: HashMap<String, i32> = HashMap::new();
}
```

### Handling Name Conflicts

When there are items with the same name, you can use `as` to rename:

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

Or only import the parent module:

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

### Nested Paths

You can use nested paths to simplify multiple `use` statements:

```rust
// Original syntax
use std::cmp::Ordering;
use std::io;

// Nested syntax
use std::{cmp::Ordering, io};

// More examples
use std::io::{self, Write, BufReader};
// Equivalent to:
// use std::io;
// use std::io::Write;
// use std::io::BufReader;
```

### The glob Operator

Use `*` to import all public items from a module:

```rust
use std::collections::*;

fn main() {
    let mut map = HashMap::new();
    let mut set = HashSet::new();
    let mut vec = VecDeque::new();
}
```

**Note**: Glob imports may cause name conflicts, typically used only in test modules or prelude patterns.

## File Structure Organization

### Standard Project Structure

A typical Rust project structure looks like this:

```
my_project/
├── Cargo.toml
├── Cargo.lock
├── src/
│   ├── main.rs      # Binary crate entry
│   ├── lib.rs       # Library crate entry (optional)
│   ├── config.rs    # Module
│   ├── utils/       # Module directory
│   │   ├── mod.rs
│   │   ├── helpers.rs
│   │   └── validators.rs
│   └── bin/         # Additional binary files
│       └── tool.rs
├── tests/           # Integration tests
│   └── integration_test.rs
├── benches/         # Benchmarks
│   └── benchmark.rs
└── examples/        # Example code
    └── demo.rs
```

### Module Declaration and File Mapping

```rust
// src/lib.rs
pub mod config;           // Looks for src/config.rs
pub mod utils;            // Looks for src/utils.rs or src/utils/mod.rs

pub use config::Settings; // Re-export
```

```rust
// src/utils.rs or src/utils/mod.rs
pub mod helpers;          // Looks for src/utils/helpers.rs
pub mod validators;       // Looks for src/utils/validators.rs

pub fn common_utility() {
    println!("Common utility function");
}
```

### Module Path References

```rust
// In src/utils/helpers.rs
use crate::config::Settings;        // Absolute path, starting from crate root
use super::validators;               // Relative path, parent module
use self::internal_module;           // Relative path, current module

mod internal_module {
    pub fn helper() {}
}
```

## Crates

A crate is the basic unit of compilation in Rust, divided into two types:

### Binary Crate

Contains a `main` function and can be compiled into an executable:

```rust
// src/main.rs
fn main() {
    println!("This is a binary crate");
}
```

### Library Crate

Does not contain a `main` function, used to provide functionality for other crates:

```rust
// src/lib.rs
pub fn library_function() {
    println!("This is a library function");
}
```

### Both Library and Binary

A project can contain both library and binary crates:

```rust
// src/lib.rs
pub fn shared_function() {
    println!("Shared functionality");
}

// src/main.rs
use my_project::shared_function;

fn main() {
    shared_function();
}
```

### Multiple Binary Crates

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

Run a specific binary:

```bash
cargo run --bin server
cargo run --bin client
```

### External Dependencies

Add dependencies in `Cargo.toml`:

```toml
[dependencies]
serde = "1.0"
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
```

Using external crates:

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
        name: String::from("John"),
        age: 30,
    };

    let json = serde_json::to_string(&user).unwrap();
    println!("{}", json);
}
```

## Workspaces

Workspaces are used to manage multiple related crates, sharing dependencies and output directories.

### Creating a Workspace

```
my_workspace/
├── Cargo.toml          # Workspace configuration
├── shared/             # Shared library
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
├── app_one/            # Application one
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
└── app_two/            # Application two
    ├── Cargo.toml
    └── src/
        └── main.rs
```

### Workspace Configuration

```toml
# my_workspace/Cargo.toml
[workspace]
members = [
    "shared",
    "app_one",
    "app_two",
]

# Shared dependency versions
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

### Workspace Operations

```bash
# Build all members
cargo build

# Build specific member
cargo build -p app_one

# Run specific member
cargo run -p app_one

# Test all members
cargo test

# Test specific member
cargo test -p shared
```

### Advantages of Workspaces

1. **Shared compilation output**: All crates share the `target` directory, avoiding redundant compilation
2. **Unified dependency versions**: Ensures all crates use the same dependency versions
3. **Simplified development workflow**: One command can operate on multiple crates
4. **Local dependency management**: Convenient for referencing other crates during development

## Re-exports

Re-exports allow you to create a cleaner public API, hiding internal module structure.

### Basic Re-export

```rust
// src/lib.rs
mod internal {
    pub mod deep {
        pub struct ImportantStruct {
            pub value: i32,
        }

        pub fn important_function() {
            println!("Important functionality");
        }
    }
}

// Re-export, users can directly use my_crate::ImportantStruct
pub use internal::deep::ImportantStruct;
pub use internal::deep::important_function;
```

When using:

```rust
// No need to know the internal structure
use my_crate::ImportantStruct;
use my_crate::important_function;
```

### Creating a Prelude Module

Many libraries provide a prelude module containing the most commonly used items:

```rust
// src/lib.rs
pub mod error;
pub mod config;
pub mod utils;

// prelude module, containing common items
pub mod prelude {
    pub use crate::error::{Error, Result};
    pub use crate::config::Config;
    pub use crate::utils::{helper1, helper2};
}
```

When using:

```rust
use my_crate::prelude::*;

fn main() -> Result<()> {
    let config = Config::new();
    helper1();
    Ok(())
}
```

### Renaming Re-exports

```rust
pub use internal::LongStructName as ShortName;
pub use internal::verbose_function_name as func;
```

### Conditional Re-exports

Combining feature flags for conditional re-exports:

```rust
#[cfg(feature = "async")]
pub use async_module::AsyncClient;

#[cfg(not(feature = "async"))]
pub use sync_module::SyncClient as Client;

#[cfg(feature = "async")]
pub use async_module::AsyncClient as Client;
```

## Practical Example: Building a Modular Project

Let's build a complete modular project example:

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

### Module Definitions

```rust
// src/lib.rs
pub mod models;
pub mod services;
pub mod utils;
pub mod error;

// Create prelude
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
            StoreError::NotFound(msg) => write!(f, "Not found: {}", msg),
            StoreError::InvalidInput(msg) => write!(f, "Invalid input: {}", msg),
            StoreError::PaymentFailed(msg) => write!(f, "Payment failed: {}", msg),
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
    inventory_count: u32,  // Private field
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
    email: String,  // Private field, needs validation
}

impl User {
    pub fn new(id: u64, username: &str, email: &str) -> crate::error::Result<Self> {
        if !crate::utils::validation::is_valid_email(email) {
            return Err(crate::error::StoreError::InvalidInput(
                "Invalid email address".to_string()
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
            .ok_or_else(|| StoreError::NotFound(format!("Product ID: {}", id)))
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
                "Insufficient payment amount".to_string()
            ));
        }

        // Simulate payment processing
        Ok(format!("Payment successful, Transaction ID: TXN{}", order.id))
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

### Usage Example

```rust
// examples/demo.rs
use online_store::prelude::*;

fn main() -> Result<()> {
    // Create products
    let laptop = Product::new(1, "Laptop", 5999.0);
    let mouse = Product::new(2, "Wireless Mouse", 199.0);

    // Set inventory
    let mut inventory = InventoryService::default();
    inventory.add_product(laptop.clone(), 10);
    inventory.add_product(mouse.clone(), 50);

    // Create user
    let user = User::new(1, "johndoe", "johndoe@example.com")?;

    // Create order
    let mut order = Order::new(1001, user);
    order.add_item(laptop, 1);
    order.add_item(mouse, 2);

    println!("Order total: ${:.2}", order.total());

    // Process payment
    let payment = PaymentService::new();
    let result = payment.process_payment(&order, 6500.0)?;
    println!("{}", result);

    Ok(())
}
```

## Best Practices

### Module Organization Principles

- Organize modules by functionality rather than type
- Keep module responsibilities singular
- Use submodule hierarchy reasonably, avoid excessive nesting

### Visibility Control

- Use private by default, only expose necessary APIs
- Use `pub(crate)` for sharing within the crate
- Use `pub(super)` to limit scope to parent module

### Import Style

- Import parent module for functions
- Import types directly
- Avoid overusing glob imports
- Use `as` to handle name conflicts

### Re-export Strategy

- Create a clear public API
- Use prelude modules for convenient imports
- Hide internal implementation details

### Workspace Usage

- Use workspaces to manage related projects
- Unify dependency versions
- Reasonably define crate boundaries

## Summary

Rust's module system provides powerful and flexible code organization capabilities:

| Feature | Purpose | Keyword/Syntax |
|---------|---------|----------------|
| Module | Organize code and namespaces | `mod` |
| Visibility | Control access permissions | `pub`, `pub(crate)`, `pub(super)` |
| Import | Simplify path references | `use`, `as` |
| Path | Locate items | `crate::`, `super::`, `self::` |
| Re-export | Create clean APIs | `pub use` |
| Workspace | Manage multi-crate projects | `[workspace]` |

Mastering these concepts will enable you to build well-structured, easily maintainable large Rust projects. The module system helps organize code and ensures encapsulation through visibility control, forming an important cornerstone of Rust's safety and maintainability.
