---
title: "Cargo包管理器"
description: "Cargo完全指南，Rust项目管理、依赖管理与发布"
category: "Rust"
subcategory: "工具链"
tags: ["Rust", "Cargo", "包管理", "构建系统"]
difficulty: "beginner"
order: 9
draft: false
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

