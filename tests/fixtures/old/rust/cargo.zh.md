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

