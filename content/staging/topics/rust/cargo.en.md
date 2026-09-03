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
origin: old/src/content/docs/rust/cargo.en.md
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

Cargo is Rust's official package manager and build system, serving as the core of the Rust development workflow. It handles project creation, dependency management, compilation and building, test execution, documentation generation, and package publishing - virtually all development tasks. Mastering Cargo is an essential step in becoming an efficient Rust developer.

## Cargo Basics

### Installation and Verification

Cargo is installed alongside Rust. When you install Rust via rustup, Cargo is automatically included.

```bash
# Verify Cargo installation
cargo --version
# Example output: cargo 1.75.0 (1d8b05cdd 2023-11-20)

# View help information
cargo help

# View help for a specific command
cargo help build
```

### Common Commands Quick Reference

```bash
# Project creation
cargo new my_project          # Create a binary project
cargo new my_library --lib    # Create a library project
cargo init                    # Initialize project in current directory

# Building and running
cargo build                   # Compile project (debug mode)
cargo build --release         # Compile project (release mode, with optimizations)
cargo run                     # Compile and run project
cargo run --release           # Run in release mode
cargo run -- arg1 arg2        # Pass arguments to the program

# Code checking
cargo check                   # Quick code check (no executable generated)
cargo clippy                  # Run lint checks
cargo fmt                     # Format code

# Testing and documentation
cargo test                    # Run all tests
cargo test test_name          # Run specific test
cargo doc --open              # Generate and open documentation
cargo bench                   # Run benchmarks

# Dependency management
cargo update                  # Update dependencies to latest compatible versions
cargo tree                    # Display dependency tree
cargo search serde            # Search packages on crates.io

# Cleanup
cargo clean                   # Clean build artifacts
```

### Creating Your First Project

```bash
# Create new project
cargo new hello_cargo
cd hello_cargo

# View project structure
tree .
# .
# ├── Cargo.toml
# └── src
#     └── main.rs
```

**Cargo.toml contents:**

```toml
[package]
name = "hello_cargo"
version = "0.1.0"
edition = "2021"

[dependencies]
```

**src/main.rs contents:**

```rust
fn main() {
    println!("Hello, world!");
}
```

```bash
# Run project
cargo run
# Output:
#    Compiling hello_cargo v0.1.0 (/path/to/hello_cargo)
#     Finished dev [unoptimized + debuginfo] target(s) in 0.50s
#      Running `target/debug/hello_cargo`
# Hello, world!
```

## Cargo.toml In-Depth

`Cargo.toml` is the project's manifest file, using TOML (Tom's Obvious, Minimal Language) format. It defines the project's metadata, dependencies, and build configuration.

### [package] Section

```toml
[package]
# Required fields
name = "my_project"           # Package name (used for crates.io and imports)
version = "0.1.0"             # Version number (follows semantic versioning)
edition = "2021"              # Rust edition (2015, 2018, 2021)

# Author information
authors = ["Zhang San <zhangsan@example.com>", "Li Si <lisi@example.com>"]

# Project description (required for publishing to crates.io)
description = "A demonstration Rust project"

# License (required for publishing)
license = "MIT"
# Or use a license file
license-file = "LICENSE"

# Project links
homepage = "https://example.com/my_project"
repository = "https://github.com/username/my_project"
documentation = "https://docs.rs/my_project"

# README file
readme = "README.md"

# Keywords and categories (used for crates.io search)
keywords = ["cli", "tool", "utility", "parser"]  # Maximum of 5
categories = ["command-line-utilities", "development-tools"]

# Rust version requirement (MSRV - Minimum Supported Rust Version)
rust-version = "1.70"

# Other options
publish = true                # Whether to allow publishing to crates.io
default-run = "main"          # Default binary to run
autobins = true               # Auto-discover bin targets
autoexamples = true           # Auto-discover examples
autotests = true              # Auto-discover tests
autobenches = true            # Auto-discover benches
```

### Defining Multiple Executables

```toml
# Default main.rs automatically becomes a bin target
# Additional binary targets can be defined

[[bin]]
name = "server"
path = "src/bin/server.rs"

[[bin]]
name = "client"
path = "src/bin/client.rs"
required-features = ["network"]  # Depends on specific feature

# Library target configuration
[lib]
name = "my_lib"               # Library name
path = "src/lib.rs"           # Library source file path
crate-type = ["lib"]          # Options: lib, dylib, staticlib, cdylib, rlib
```

**Example project structure:**

```
my_project/
├── Cargo.toml
├── src/
│   ├── main.rs           # Default binary
│   ├── lib.rs            # Library
│   └── bin/
│       ├── server.rs     # server binary
│       └── client.rs     # client binary
├── examples/
│   └── demo.rs           # Example program
├── tests/
│   └── integration.rs    # Integration tests
└── benches/
    └── benchmark.rs      # Benchmarks
```

```bash
# Run specific binary
cargo run --bin server
cargo run --bin client

# Run example
cargo run --example demo
```

### Example and Test Configuration

```toml
# Example configuration
[[example]]
name = "advanced_demo"
path = "examples/advanced.rs"
required-features = ["advanced"]

# Test configuration
[[test]]
name = "integration"
path = "tests/integration.rs"

# Benchmark configuration
[[bench]]
name = "my_benchmark"
path = "benches/benchmark.rs"
harness = false  # Don't use default test framework
```

## Dependency Management

Dependency management is one of Cargo's core features. Cargo downloads and manages dependencies from crates.io (Rust's official package registry).

### Adding Dependencies

```toml
[dependencies]
# Simplest form - specify version
serde = "1.0"

# Full form - with extra options
serde = { version = "1.0", features = ["derive"] }

# Multiple dependency sources

# From crates.io (default)
regex = "1.10"

# From Git repository
my_lib = { git = "https://github.com/user/my_lib" }
my_lib = { git = "https://github.com/user/my_lib", branch = "develop" }
my_lib = { git = "https://github.com/user/my_lib", tag = "v1.0.0" }
my_lib = { git = "https://github.com/user/my_lib", rev = "a1b2c3d" }

# From local path
local_lib = { path = "../local_lib" }

# From other registries
my_crate = { version = "1.0", registry = "my-registry" }
```

### Version Syntax Explained

Cargo uses Semantic Versioning (SemVer), formatted as `MAJOR.MINOR.PATCH`:

- **MAJOR**: Incompatible API changes
- **MINOR**: Backward-compatible new features
- **PATCH**: Backward-compatible bug fixes

```toml
[dependencies]
# Caret (^) - default behavior
# Allows updates that don't modify the left-most non-zero digit
serde = "^1.2.3"    # >=1.2.3, <2.0.0
serde = "^0.2.3"    # >=0.2.3, <0.3.0 (special handling for 0.x versions)
serde = "^0.0.3"    # >=0.0.3, <0.0.4 (stricter for 0.0.x versions)

# Tilde (~) - allows minimal version updates
serde = "~1.2.3"    # >=1.2.3, <1.3.0
serde = "~1.2"      # >=1.2.0, <1.3.0
serde = "~1"        # >=1.0.0, <2.0.0

# Wildcard (*)
serde = "1.*"       # >=1.0.0, <2.0.0
serde = "1.2.*"     # >=1.2.0, <1.3.0

# Exact version
serde = "=1.2.3"    # Must be exactly 1.2.3

# Comparison operators
serde = ">1.2.3"
serde = ">=1.2.3"
serde = "<2.0.0"
serde = "<=2.0.0"

# Combined conditions
serde = ">=1.2.3, <1.5.0"
serde = ">=1.2, <1.5"
```

### Dependency Types

```toml
# Regular dependencies - needed for compilation and runtime
[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.35", features = ["rt-multi-thread", "macros"] }
reqwest = { version = "0.11", default-features = false, features = ["json", "rustls-tls"] }

# Dev dependencies - only for tests, examples, and benchmarks
[dev-dependencies]
criterion = "0.5"        # Benchmarking framework
proptest = "1.4"         # Property testing
mockito = "1.2"          # HTTP mock
tempfile = "3.9"         # Temporary files
pretty_assertions = "1.4" # Better assertion output

# Build dependencies - only for build.rs scripts
[build-dependencies]
cc = "1.0"               # Compile C/C++ code
bindgen = "0.69"         # Generate FFI bindings
prost-build = "0.12"     # Compile Protocol Buffers
```

### Platform-Specific Dependencies

```toml
# Windows-specific dependencies
[target.'cfg(windows)'.dependencies]
winapi = { version = "0.3", features = ["winuser", "processthreadsapi"] }

# Unix-specific dependencies
[target.'cfg(unix)'.dependencies]
libc = "0.2"
nix = "0.27"

# macOS-specific dependencies
[target.'cfg(target_os = "macos")'.dependencies]
cocoa = "0.25"

# Linux-specific dependencies
[target.'cfg(target_os = "linux")'.dependencies]
inotify = "0.10"

# Architecture-specific dependencies
[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "0.2"
js-sys = "0.3"
web-sys = { version = "0.3", features = ["Window", "Document"] }

# Combined conditions
[target.'cfg(all(unix, target_pointer_width = "64"))'.dependencies]
special_lib = "1.0"
```

### Renaming and Multi-Version Dependencies

```toml
[dependencies]
# Rename dependency
rand_crate = { package = "rand", version = "0.8" }

# Use different versions of the same package
tokio_old = { package = "tokio", version = "0.2" }
tokio = "1.35"
```

```rust
// Use the renamed name in code
use rand_crate::Rng;
use tokio_old::runtime::Runtime as OldRuntime;
use tokio::runtime::Runtime;
```

### Cargo.lock File

`Cargo.lock` records the exact versions of all dependencies, ensuring build reproducibility.

```bash
# Update all dependencies to latest compatible versions
cargo update

# Update specific dependency
cargo update -p serde

# View outdated dependencies (requires cargo-outdated)
cargo install cargo-outdated
cargo outdated
```

**Best practices:**
- **Binary projects**: Commit `Cargo.lock` to version control
- **Library projects**: Typically don't commit `Cargo.lock` (let users decide versions)

## Features System

Features are Cargo's conditional compilation mechanism, allowing you to enable or disable specific parts of code.

### Defining Features

```toml
[package]
name = "my_http_client"
version = "0.1.0"

[features]
# Features enabled by default
default = ["std", "json"]

# Basic features
std = []                      # Standard library support
json = ["serde_json"]         # JSON support
xml = ["quick-xml"]           # XML support
yaml = ["serde_yaml"]         # YAML support

# Network backend selection (mutually exclusive)
native-tls = ["reqwest/native-tls"]
rustls-tls = ["reqwest/rustls-tls"]

# Combined feature
full = ["std", "json", "xml", "yaml", "native-tls"]

# Features depending on others
logging = ["log", "env_logger"]
tracing-support = ["tracing", "tracing-subscriber"]

[dependencies]
# Always included dependency
reqwest = { version = "0.11", default-features = false }

# Optional dependencies (associated with features)
serde_json = { version = "1.0", optional = true }
quick-xml = { version = "0.31", optional = true }
serde_yaml = { version = "0.9", optional = true }
log = { version = "0.4", optional = true }
env_logger = { version = "0.10", optional = true }
tracing = { version = "0.1", optional = true }
tracing-subscriber = { version = "0.3", optional = true }
```

### Using Conditional Compilation

```rust
// lib.rs

// Module-level conditional compilation
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
        // XML parsing logic
        Ok(input.to_string())
    }
}

// Function-level conditional compilation
pub struct Client {
    base_url: String,
}

impl Client {
    pub fn new(base_url: &str) -> Self {
        #[cfg(feature = "logging")]
        log::info!("Creating new HTTP client: {}", base_url);

        Client {
            base_url: base_url.to_string(),
        }
    }

    // Only available when json feature is enabled
    #[cfg(feature = "json")]
    pub fn get_json<T: serde::de::DeserializeOwned>(
        &self,
        path: &str
    ) -> Result<T, Box<dyn std::error::Error>> {
        let url = format!("{}{}", self.base_url, path);
        // Fetch and parse JSON
        todo!()
    }
}

// Using cfg_attr for conditional derives
#[derive(Debug, Clone)]
#[cfg_attr(feature = "json", derive(serde::Serialize, serde::Deserialize))]
pub struct Config {
    pub timeout: u64,
    pub retries: u32,
}

// Using cfg! macro to check at runtime
pub fn print_features() {
    println!("Enabled features:");

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

### Using Features

```bash
# Use default features
cargo build

# Disable default features
cargo build --no-default-features

# Enable specific features
cargo build --features "json,xml"

# Disable default and enable specific features
cargo build --no-default-features --features "json"

# Enable all features
cargo build --all-features
```

**Specifying features in dependencies:**

```toml
[dependencies]
# Use default features
my_http_client = "0.1"

# Enable additional features
my_http_client = { version = "0.1", features = ["xml", "yaml"] }

# Disable default features
my_http_client = { version = "0.1", default-features = false }

# Disable default and enable specific features
my_http_client = { version = "0.1", default-features = false, features = ["json"] }
```

### Feature Design Best Practices

```toml
[features]
# Provide sensible defaults
default = ["std"]

# Avoid conflicts between features
# Bad: backend-a and backend-b are mutually exclusive but not clearly stated
# Good: Clearly document in docs or use compile-time checks

# Use meaningful names
# Bad: f1, f2, extra
# Good: json-support, async-runtime, native-tls

# Provide a "full" feature for convenience
full = ["std", "json", "xml", "yaml", "logging"]

# Keep features additive
# Enabling more features should not cause compilation failures
```

```rust
// Compile-time check for mutually exclusive features
#[cfg(all(feature = "native-tls", feature = "rustls-tls"))]
compile_error!("features 'native-tls' and 'rustls-tls' cannot be enabled simultaneously");
```

## Workspaces

Workspaces allow managing multiple related packages within a single project, sharing dependencies and build outputs.

### Workspace Structure

```
my_workspace/
├── Cargo.toml              # Workspace root configuration
├── Cargo.lock              # Shared lock file
├── target/                 # Shared build directory
├── app/                    # Main application
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
├── core/                   # Core library
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
├── utils/                  # Utility library
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
└── cli/                    # CLI tool
    ├── Cargo.toml
    └── src/
        └── main.rs
```

### Workspace Configuration

**Root Cargo.toml:**

```toml
[workspace]
# Workspace members
members = [
    "app",
    "core",
    "utils",
    "cli",
]

# Exclude certain directories
exclude = [
    "experiments",
    "deprecated",
]

# Resolver version (recommended to use "2")
resolver = "2"

# Workspace-level dependencies (Cargo 1.64+)
[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.35", features = ["full"] }
thiserror = "1.0"
anyhow = "1.0"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# Workspace-level package metadata
[workspace.package]
version = "0.1.0"
edition = "2021"
authors = ["Development Team <team@example.com>"]
license = "MIT"
repository = "https://github.com/team/my_workspace"
rust-version = "1.70"
```

**Sub-package Cargo.toml (app/Cargo.toml):**

```toml
[package]
name = "app"
# Inherit workspace configuration
version.workspace = true
edition.workspace = true
authors.workspace = true
license.workspace = true

[dependencies]
# Use workspace dependencies
serde.workspace = true
serde_json.workspace = true
tokio.workspace = true
tracing.workspace = true

# Local dependencies within workspace
core = { path = "../core" }
utils = { path = "../utils" }

# Package-specific dependencies
clap = { version = "4.4", features = ["derive"] }
```

**Sub-package Cargo.toml (core/Cargo.toml):**

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

# Internal dependency
utils = { path = "../utils" }
```

### Workspace Commands

```bash
# Build entire workspace
cargo build --workspace
cargo build -p app -p core   # Build specific packages

# Run specific package
cargo run -p app
cargo run -p cli -- --help

# Test entire workspace
cargo test --workspace

# Test specific package
cargo test -p core
cargo test -p utils --lib    # Only test library code

# Check entire workspace
cargo check --workspace

# Documentation
cargo doc --workspace --no-deps

# Publish packages in workspace
cargo publish -p utils       # Publish lower-level dependencies first
cargo publish -p core
cargo publish -p app
```

### Workspace Practice Example

**utils/src/lib.rs:**

```rust
//! Common utility functions library

/// Format a timestamp
pub fn format_timestamp(timestamp: u64) -> String {
    // Simple implementation
    format!("{} seconds", timestamp)
}

/// Validate email format
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
//! Core business logic library

use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CoreError {
    #[error("User not found: {0}")]
    UserNotFound(String),
    #[error("Validation failed: {0}")]
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
                "Invalid email format".to_string()
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
#[command(about = "User management application")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Parser)]
enum Commands {
    /// Add new user
    Add {
        #[arg(short, long)]
        name: String,
        #[arg(short, long)]
        email: String,
    },
    /// List all users
    List,
}

fn main() {
    // Initialize logging
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
                    info!("User {} added successfully", name);
                }
                Err(e) => {
                    eprintln!("Error: {}", e);
                }
            }
        }
        Commands::List => {
            info!("Listing all users...");
            // In a real application, would read from storage
        }
    }
}
```

## Build Configuration and Profiles

Profiles allow configuring different compilation options for different scenarios (development, release, testing).

### Built-in Profiles

```toml
# Dev profile (cargo build, cargo run)
[profile.dev]
opt-level = 0        # No optimization, fast compilation
debug = true         # Include debug info
split-debuginfo = "..."  # Debug info splitting method
debug-assertions = true  # Enable debug assertions
overflow-checks = true   # Integer overflow checks
lto = false              # Link-time optimization
panic = "unwind"         # Unwind stack on panic
incremental = true       # Incremental compilation
codegen-units = 256      # Parallel codegen units

# Release profile (cargo build --release)
[profile.release]
opt-level = 3        # Maximum optimization
debug = false        # No debug info
debug-assertions = false
overflow-checks = false
lto = false          # Can set to true or "thin"
panic = "unwind"
incremental = false
codegen-units = 16

# Test profile (cargo test)
[profile.test]
inherits = "dev"     # Inherit dev profile
opt-level = 0

# Bench profile (cargo bench)
[profile.bench]
inherits = "release" # Inherit release profile
debug = false
```

### Optimization Options Explained

```toml
[profile.release]
# Optimization level
opt-level = 3        # 0: No optimization
                     # 1: Basic optimization
                     # 2: More optimization
                     # 3: All optimizations (default for release)
                     # "s": Optimize for size
                     # "z": Minimum size

# Link-time optimization (LTO)
lto = "fat"          # false: Disabled
                     # true/"fat": Full LTO (slowest compile, best performance)
                     # "thin": Faster LTO
                     # "off": Disabled

# Codegen units
codegen-units = 1    # Reducing improves optimization but slows compilation

# Panic behavior
panic = "abort"      # "unwind": Unwind stack (supports catch_unwind)
                     # "abort": Terminate immediately (smaller binary)

# Strip symbols
strip = "symbols"    # "none": Don't strip
                     # "debuginfo": Strip debug info only
                     # "symbols": Strip all symbols
```

### Custom Profiles

```toml
# Profiling profile
[profile.profiling]
inherits = "release"
debug = true         # Keep debug symbols for profilers
strip = "none"

# Fast release (compromise)
[profile.release-fast]
inherits = "release"
lto = "thin"
codegen-units = 4

# Minimum size
[profile.min-size]
inherits = "release"
opt-level = "z"
lto = true
codegen-units = 1
panic = "abort"
strip = "symbols"

# CI testing (slightly optimized for faster tests)
[profile.ci-test]
inherits = "test"
opt-level = 1
```

```bash
# Use custom profile
cargo build --profile profiling
cargo build --profile min-size
```

### Dependency Optimization

```toml
# Set different optimization levels for specific dependencies
[profile.dev.package."*"]
opt-level = 2        # All dependencies use opt-level 2

[profile.dev.package.image]
opt-level = 3        # Image processing library uses maximum optimization

[profile.dev.package.regex]
opt-level = 2        # Regex library uses moderate optimization

# Optimize all dependencies in dev mode, but not your own code
[profile.dev.package.my_project]
opt-level = 0
debug = true
```

## Publishing Crates

Publish crates to crates.io for other developers to use.

### Preparing for Publication

**Required Cargo.toml fields:**

```toml
[package]
name = "my_awesome_crate"
version = "0.1.0"
edition = "2021"
license = "MIT OR Apache-2.0"    # Required
description = "A practical Rust library"  # Required
repository = "https://github.com/user/my_awesome_crate"
documentation = "https://docs.rs/my_awesome_crate"
readme = "README.md"
keywords = ["utility", "tool"]    # Maximum of 5
categories = ["development-tools"]

# Include/exclude files
include = [
    "src/**/*",
    "Cargo.toml",
    "README.md",
    "LICENSE-*",
    "CHANGELOG.md",
]

# Or use exclude
exclude = [
    ".github/**",
    "tests/fixtures/**",
    "*.sh",
    ".gitignore",
]
```

### Writing Documentation

```rust
//! # My Awesome Crate
//!
//! `my_awesome_crate` provides a series of practical utility functions.
//!
//! ## Features
//!
//! - High-performance string processing
//! - Type-safe configuration management
//! - Async support
//!
//! ## Quick Start
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
//! - `async`: Enable async support
//! - `serde`: Enable serialization support

/// String utilities
///
/// Provides various string processing functions.
///
/// # Examples
///
/// ```rust
/// use my_awesome_crate::StringUtils;
///
/// // Reverse a string
/// let reversed = StringUtils::reverse("Rust");
/// assert_eq!(reversed, "tsuR");
///
/// // Check palindrome
/// assert!(StringUtils::is_palindrome("madam"));
/// ```
pub struct StringUtils;

impl StringUtils {
    /// Reverse a string
    ///
    /// # Arguments
    ///
    /// * `s` - The string slice to reverse
    ///
    /// # Returns
    ///
    /// Returns a new reversed string
    ///
    /// # Examples
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

    /// Check if a string is a palindrome
    ///
    /// Comparison is case-insensitive.
    ///
    /// # Examples
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

/// Error types
///
/// Represents various errors that can occur.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    /// Invalid input
    #[error("Invalid input: {0}")]
    InvalidInput(String),

    /// IO error
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

/// Type alias to simplify Result
pub type Result<T> = std::result::Result<T, Error>;
```

### Version Management

Follow Semantic Versioning (SemVer):

```
version = "MAJOR.MINOR.PATCH"
```

**When to increment version numbers:**

| Change Type | Version | Example |
|-------------|---------|---------|
| Incompatible API changes | MAJOR | 1.0.0 -> 2.0.0 |
| Backward-compatible new features | MINOR | 1.0.0 -> 1.1.0 |
| Backward-compatible bug fixes | PATCH | 1.0.0 -> 1.0.1 |

**Special rules for 0.x.y versions:**

- `0.0.z`: Every change may be incompatible
- `0.y.z`: Minor version changes may be incompatible

### Publishing Process

```bash
# Register a crates.io account and get an API token
# Visit https://crates.io/me

# Login
cargo login <your-api-token>

# Verify package contents
cargo package --list        # View files that will be included
cargo package               # Create .crate file

# Dry run publish
cargo publish --dry-run

# Publish
cargo publish

# View publish results
# https://crates.io/crates/my_awesome_crate
# https://docs.rs/my_awesome_crate
```

### Version Management Commands

```bash
# Yank a version (mark as deprecated, but don't delete)
cargo yank --version 0.1.0

# Undo yank
cargo yank --version 0.1.0 --undo

# View published versions
cargo search my_awesome_crate
```

### Publishing Checklist

- [ ] Update version number in `Cargo.toml`
- [ ] Update `CHANGELOG.md`
- [ ] Ensure all tests pass: `cargo test`
- [ ] Run clippy checks: `cargo clippy`
- [ ] Format code: `cargo fmt`
- [ ] Check documentation: `cargo doc --open`
- [ ] Verify README and example code
- [ ] Test dry run: `cargo publish --dry-run`
- [ ] Create Git tag: `git tag v0.1.0`
- [ ] Publish: `cargo publish`

## Cargo Commands In-Depth

### Build Commands

```bash
# Basic build
cargo build                      # Debug build
cargo build --release            # Release build
cargo build --target x86_64-unknown-linux-gnu  # Cross-compile

# Build options
cargo build --jobs 4             # Specify parallel job count
cargo build --verbose            # Verbose output
cargo build --timings            # Show compilation timing analysis

# Check code (no binary generated)
cargo check                      # Quick type checking
cargo check --all-targets        # Check all targets
cargo check --all-features       # Check all features
```

### Running and Testing

```bash
# Running
cargo run                        # Run default binary
cargo run --bin app              # Run specific binary
cargo run --example demo         # Run example
cargo run -- arg1 arg2           # Pass arguments

# Testing
cargo test                       # Run all tests
cargo test test_name             # Run tests matching name
cargo test -- --nocapture        # Show println! output
cargo test -- --test-threads=1   # Run tests single-threaded
cargo test --doc                 # Run doc tests only
cargo test --lib                 # Run library tests only
cargo test --test integration    # Run specific integration test

# Benchmarking
cargo bench                      # Run all benchmarks
cargo bench bench_name           # Run specific benchmark
```

### Documentation and Formatting

```bash
# Documentation
cargo doc                        # Generate documentation
cargo doc --open                 # Generate and open
cargo doc --no-deps              # Exclude dependency docs
cargo doc --document-private-items  # Include private items

# Formatting
cargo fmt                        # Format code
cargo fmt -- --check             # Check format (no changes)

# Lint
cargo clippy                     # Run clippy
cargo clippy -- -D warnings      # Treat warnings as errors
cargo clippy --fix               # Auto-fix
```

### Dependency Management

```bash
# Update dependencies
cargo update                     # Update all dependencies
cargo update -p serde            # Update specific package
cargo update --dry-run           # Simulate update

# View dependencies
cargo tree                       # Show dependency tree
cargo tree -d                    # Show duplicate dependencies
cargo tree -i serde              # See who depends on serde
cargo tree --format "{p} {f}"    # Custom format

# Search
cargo search serde               # Search crates.io
```

### Cleanup and Caching

```bash
# Cleanup
cargo clean                      # Delete target directory
cargo clean --release            # Clean release build only
cargo clean -p my_crate          # Clean specific package

# Cache management (requires cargo-cache)
cargo install cargo-cache
cargo cache                      # View cache info
cargo cache --autoclean          # Auto cleanup
```

## Configuration Files and Environment

### .cargo/config.toml

Create a configuration file in the project root or `~/.cargo/`:

```toml
# Build settings
[build]
target = "x86_64-unknown-linux-gnu"  # Default target
jobs = 4                              # Parallel job count
incremental = true                    # Incremental compilation
rustflags = ["-C", "target-cpu=native"]  # Compiler flags

# Command aliases
[alias]
b = "build"
br = "build --release"
c = "check"
t = "test"
r = "run"
d = "doc --open"
lint = "clippy -- -W clippy::pedantic"
expand = "rustc -- -Zunpretty=expanded"

# Replace source (use domestic mirrors)
[source.crates-io]
replace-with = "ustc"

[source.ustc]
registry = "sparse+https://mirrors.ustc.edu.cn/crates.io-index/"

# Can also use other mirrors
# [source.tuna]
# registry = "sparse+https://mirrors.tuna.tsinghua.edu.cn/crates.io-index/"

# [source.rsproxy]
# registry = "sparse+https://rsproxy.cn/index/"

# Target-specific settings
[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=lld"]

[target.aarch64-linux-android]
linker = "aarch64-linux-android-clang"

# Environment variables
[env]
RUST_BACKTRACE = "1"
RUST_LOG = "info"

# Network settings
[net]
retry = 3                             # Retry count
git-fetch-with-cli = true             # Use system git
offline = false                       # Offline mode

# Registry settings
[registries]
my-registry = { index = "https://my-registry.com/index" }
```

### Environment Variables

```bash
# Build-related
CARGO_BUILD_JOBS=4                   # Parallel job count
CARGO_BUILD_TARGET=x86_64-unknown-linux-gnu
CARGO_INCREMENTAL=1                  # Incremental compilation

# Compiler settings
RUSTFLAGS="-C target-cpu=native"     # rustc flags
RUSTDOCFLAGS="--cfg docsrs"          # rustdoc flags

# Cache directories
CARGO_HOME=/path/to/cargo            # Cargo home directory
CARGO_TARGET_DIR=/path/to/target     # Build output directory

# Debugging
RUST_BACKTRACE=1                     # Show backtrace
RUST_LOG=debug                       # Log level

# Network
CARGO_HTTP_PROXY=http://proxy:8080
CARGO_HTTPS_PROXY=https://proxy:8080
```

### build.rs Build Script

```rust
// build.rs
use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // Get environment variables
    let out_dir = env::var("OUT_DIR").unwrap();
    let profile = env::var("PROFILE").unwrap();

    println!("cargo:warning=Build mode: {}", profile);

    // Generate code
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

    // Link C libraries
    println!("cargo:rustc-link-lib=ssl");
    println!("cargo:rustc-link-lib=crypto");
    println!("cargo:rustc-link-search=native=/usr/lib");

    // Set environment variable (accessible in code via env!)
    println!("cargo:rustc-env=BUILD_PROFILE={}", profile);

    // Conditional compilation
    if cfg!(target_os = "linux") {
        println!("cargo:rustc-cfg=linux_specific");
    }

    // Rerun conditions
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
// Include generated code
include!(concat!(env!("OUT_DIR"), "/generated.rs"));

pub fn print_build_info() {
    println!("Build time: {}", BUILD_TIME);
    println!("Git Hash: {}", GIT_HASH);
    println!("Build mode: {}", env!("BUILD_PROFILE"));
}
```

## Common Cargo Extensions

### Essential Extensions

```bash
# cargo-edit: Enhanced dependency management
cargo install cargo-edit
cargo add serde                      # Add dependency
cargo add tokio --features full      # With features
cargo rm serde                       # Remove dependency
cargo upgrade                        # Upgrade dependencies

# cargo-watch: File watching
cargo install cargo-watch
cargo watch -x check                 # Check on file change
cargo watch -x test                  # Test on file change
cargo watch -x 'run -- --port 8080'  # Run on file change

# cargo-expand: Macro expansion
cargo install cargo-expand
cargo expand                         # Expand all macros
cargo expand my_module::my_fn        # Expand specific item
```

### Code Quality Tools

```bash
# cargo-audit: Security audit
cargo install cargo-audit
cargo audit                          # Check for known vulnerabilities

# cargo-outdated: Check outdated dependencies
cargo install cargo-outdated
cargo outdated                       # Show outdated dependencies

# cargo-deny: Dependency checks
cargo install cargo-deny
cargo deny check                     # Run all checks
cargo deny check licenses            # Check licenses only
cargo deny check bans                # Check banned packages
```

### Performance and Analysis

```bash
# cargo-flamegraph: Flame graphs
cargo install flamegraph
cargo flamegraph                     # Generate flame graph

# cargo-bloat: Binary size analysis
cargo install cargo-bloat
cargo bloat --release                # Analyze size
cargo bloat --release --crates       # Analyze by crate

# cargo-llvm-lines: Code bloat analysis
cargo install cargo-llvm-lines
cargo llvm-lines --release           # Analyze LLVM IR line count
```

### Publishing and Versioning

```bash
# cargo-release: Automated releasing
cargo install cargo-release
cargo release patch                  # Release patch version
cargo release minor                  # Release minor version
cargo release major                  # Release major version

# cargo-make: Task runner
cargo install cargo-make
cargo make build                     # Run build task
cargo make test                      # Run test task
```

## Best Practices

### Project Structure

```
my_project/
├── Cargo.toml
├── Cargo.lock                 # Binary projects should commit this
├── README.md
├── LICENSE
├── CHANGELOG.md
├── .gitignore
├── .cargo/
│   └── config.toml           # Project-level Cargo configuration
├── src/
│   ├── main.rs               # Or lib.rs
│   ├── lib.rs                # Can have both main.rs and lib.rs
│   └── bin/
│       └── other_binary.rs
├── tests/
│   ├── common/
│   │   └── mod.rs            # Shared test code
│   └── integration_test.rs
├── examples/
│   └── demo.rs
├── benches/
│   └── benchmark.rs
└── docs/
    └── architecture.md
```

### Dependency Management Recommendations

```toml
[dependencies]
# Use precise version ranges
serde = "1.0"                        # Good: compatible with 1.x
# serde = "*"                        # Avoid: too permissive

# Only enable needed features
tokio = { version = "1", features = ["rt-multi-thread", "macros"] }
# tokio = { version = "1", features = ["full"] }  # Avoid enabling all

# Separate dev dependencies
[dev-dependencies]
criterion = "0.5"
proptest = "1.4"

# Use workspace to unify versions
[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
```

### Performance Optimization Configuration

```toml
[profile.release]
opt-level = 3
lto = "thin"                         # Balance compile speed and performance
codegen-units = 1                    # Better optimization
strip = true                         # Reduce size
panic = "abort"                      # Smaller binary

# Optimize dependencies during development
[profile.dev.package."*"]
opt-level = 2

# Keep your own code unoptimized for faster compilation
[profile.dev.package.my_project]
opt-level = 0
```

### CI/CD Configuration Example

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

      - name: Check formatting
        run: cargo fmt --all -- --check

      - name: Clippy
        run: cargo clippy --all-targets --all-features -- -D warnings

      - name: Test
        run: cargo test --all-features

      - name: Build docs
        run: cargo doc --no-deps --all-features
```

## Common Issues and Solutions

### Compilation Speed Optimization

```bash
# Use cargo check instead of cargo build
cargo check

# Use sccache to cache compilation results
cargo install sccache
export RUSTC_WRAPPER=sccache

# Use a faster linker
# Linux: mold
# macOS: zld
# Windows: lld

# Configure in .cargo/config.toml
[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=mold"]

# Reduce dependencies
cargo tree -d  # Find duplicate dependencies
```

### Dependency Conflict Resolution

```bash
# View dependency tree to find conflicts
cargo tree -d

# See who depends on a specific package
cargo tree -i serde

# Force update specific package
cargo update -p serde --precise 1.0.200
```

### Offline Building

```bash
# Download all dependencies for offline use
cargo fetch

# Offline build
cargo build --offline

# Or set in configuration
[net]
offline = true
```

### Clearing Disk Space

```bash
# Clean current project
cargo clean

# Clean global cache
cargo install cargo-cache
cargo cache --info
cargo cache --autoclean

# Manual cleanup
rm -rf ~/.cargo/registry/cache
rm -rf ~/.cargo/git/checkouts
```

## Summary

Cargo is the core of the Rust ecosystem, and mastering it is essential for efficient Rust development:

1. **Project Management**: Use `cargo new` to create projects, follow standard directory structure
2. **Dependency Management**: Understand version semantics, use features wisely, update dependencies regularly
3. **Build Configuration**: Use profiles to optimize development and release builds
4. **Workspaces**: Manage complex multi-package projects
5. **Publishing Process**: Follow SemVer, write comprehensive documentation
6. **Tool Extensions**: Use cargo-edit, cargo-watch, etc. to boost productivity

By mastering these concepts and tools, you will be able to manage Rust projects more efficiently, collaborate with the community, and publish high-quality crates.

## Reference Resources

- [Cargo Official Documentation](https://doc.rust-lang.org/cargo/)
- [The Cargo Book](https://doc.rust-lang.org/cargo/index.html)
- [crates.io](https://crates.io/)
- [docs.rs](https://docs.rs/)
- [Semantic Versioning Specification](https://semver.org/)
- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
