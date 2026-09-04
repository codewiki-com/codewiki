---
title: 测试
description: Rust测试完全指南，单元测试、集成测试与文档测试
track: rust
section: cargo-tooling
difficulty: intermediate
tags:
  - Rust
  - 测试
  - 单元测试
  - 集成测试
status: imported
origin: old/src/content/docs/rust/testing.zh.md
divergence: 0.202
issues: []
legacy:
  category: Rust
  subcategory: 测试
  order: 12
  lastUpdated: 2026-01-07
---

测试是软件开发的重要环节,Rust 内置了强大的测试框架。它支持单元测试、集成测试和文档测试三种类型,所有测试都可以通过 `cargo test` 命令一键运行。本文将全面介绍 Rust 测试的各个方面。

## 测试基础

### `#[test]` 属性

在 Rust 中,测试函数使用 `#[test]` 属性标注。当运行 `cargo test` 时,Rust 会构建一个测试运行器,执行所有带有此属性的函数。

```rust
// src/lib.rs
pub fn add(left: usize, right: usize) -> usize {
    left + right
}

#[test]
fn test_add() {
    let result = add(2, 2);
    assert_eq!(result, 4);
}
```

运行测试:

```bash
$ cargo test
   Compiling mylib v0.1.0
    Finished test [unoptimized + debuginfo] target(s) in 0.72s
     Running unittests src/lib.rs

running 1 test
test test_add ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

### 测试函数的要求

测试函数通常:
- 没有参数
- 返回 `()` 或 `Result<(), E>`
- 如果函数 panic,测试失败;如果正常返回,测试通过

```rust
// 返回 () 的测试
#[test]
fn test_with_unit_return() {
    assert!(true);
}

// 返回 Result 的测试(Rust 2018+)
#[test]
fn test_with_result() -> Result<(), String> {
    if 2 + 2 == 4 {
        Ok(())
    } else {
        Err(String::from("数学坏掉了!"))
    }
}
```

使用 `Result` 返回类型的优势是可以使用 `?` 操作符简化错误处理:

```rust
#[test]
fn test_file_parsing() -> Result<(), Box<dyn std::error::Error>> {
    let content = std::fs::read_to_string("test_data.txt")?;
    let parsed: i32 = content.trim().parse()?;
    assert_eq!(parsed, 42);
    Ok(())
}
```

## 断言宏

Rust 提供了多个断言宏用于测试验证。

### `assert!` 宏

验证表达式为 `true`:

```rust
#[test]
fn test_assert() {
    let x = 5;
    assert!(x > 0);
    assert!(x < 10);
    assert!(x >= 5 && x <= 5);
}
```

### `assert_eq!` 和 `assert_ne!` 宏

比较两个值是否相等或不相等:

```rust
pub fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

#[test]
fn test_multiply() {
    assert_eq!(multiply(2, 3), 6);
    assert_eq!(multiply(0, 100), 0);
    assert_eq!(multiply(-1, -1), 1);
}

#[test]
fn test_not_equal() {
    assert_ne!(multiply(2, 2), 5);
}
```

`assert_eq!` 和 `assert_ne!` 要求比较的值实现 `PartialEq` 和 `Debug` trait:

```rust
#[derive(Debug, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

#[test]
fn test_point_equality() {
    let p1 = Point { x: 1, y: 2 };
    let p2 = Point { x: 1, y: 2 };
    let p3 = Point { x: 3, y: 4 };

    assert_eq!(p1, p2);
    assert_ne!(p1, p3);
}
```

### 自定义错误消息

所有断言宏都支持格式化的自定义消息:

```rust
pub fn greeting(name: &str) -> String {
    format!("Hello {}!", name)
}

#[test]
fn test_greeting_contains_name() {
    let result = greeting("Carol");
    assert!(
        result.contains("Carol"),
        "问候语应该包含名字,实际得到: `{}`",
        result
    );
}

#[test]
fn test_greeting_format() {
    let result = greeting("Alice");
    assert_eq!(
        result,
        "Hello Alice!",
        "问候语格式不正确,name = {}",
        "Alice"
    );
}
```

### `debug_assert!` 系列宏

这些宏只在调试模式下执行,发布模式会被编译器优化掉:

```rust
fn compute(x: i32) -> i32 {
    debug_assert!(x >= 0, "x 必须是非负数");
    x * 2
}

#[test]
fn test_debug_assertions() {
    // 在测试模式(调试)下会检查
    assert_eq!(compute(5), 10);
}
```

## 测试组织

### 单元测试模块

按照惯例,单元测试放在与被测代码相同的文件中,使用 `#[cfg(test)]` 条件编译:

```rust
// src/lib.rs
pub struct Calculator {
    value: f64,
}

impl Calculator {
    pub fn new() -> Self {
        Calculator { value: 0.0 }
    }

    pub fn add(&mut self, n: f64) -> &mut Self {
        self.value += n;
        self
    }

    pub fn subtract(&mut self, n: f64) -> &mut Self {
        self.value -= n;
        self
    }

    pub fn multiply(&mut self, n: f64) -> &mut Self {
        self.value *= n;
        self
    }

    pub fn divide(&mut self, n: f64) -> Result<&mut Self, &'static str> {
        if n == 0.0 {
            Err("除数不能为零")
        } else {
            self.value /= n;
            Ok(self)
        }
    }

    pub fn result(&self) -> f64 {
        self.value
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_calculator() {
        let calc = Calculator::new();
        assert_eq!(calc.result(), 0.0);
    }

    #[test]
    fn test_add() {
        let mut calc = Calculator::new();
        calc.add(5.0);
        assert_eq!(calc.result(), 5.0);
    }

    #[test]
    fn test_chain_operations() {
        let mut calc = Calculator::new();
        calc.add(10.0).subtract(3.0).multiply(2.0);
        assert_eq!(calc.result(), 14.0);
    }

    #[test]
    fn test_divide_by_zero() {
        let mut calc = Calculator::new();
        calc.add(10.0);
        let result = calc.divide(0.0);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "除数不能为零");
    }
}
```

`#[cfg(test)]` 的作用:
- 只在运行 `cargo test` 时编译测试代码
- 正常的 `cargo build` 不会包含测试代码
- 减少生产代码的体积

### 测试私有函数

Rust 允许测试私有函数,因为测试模块是父模块的子模块:

```rust
// src/lib.rs
fn internal_add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn public_add(a: i32, b: i32) -> i32 {
    internal_add(a, b)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_internal_add() {
        // 可以直接测试私有函数
        assert_eq!(internal_add(2, 3), 5);
    }

    #[test]
    fn test_public_add() {
        assert_eq!(public_add(2, 3), 5);
    }
}
```

## 测试属性

### `#[should_panic]` 属性

验证代码应该 panic:

```rust
pub fn divide(a: i32, b: i32) -> i32 {
    if b == 0 {
        panic!("除数不能为零!");
    }
    a / b
}

#[test]
#[should_panic]
fn test_divide_by_zero_panics() {
    divide(10, 0);
}
```

使用 `expected` 参数验证 panic 消息:

```rust
#[test]
#[should_panic(expected = "除数不能为零")]
fn test_divide_by_zero_panics_with_message() {
    divide(10, 0);
}
```

`expected` 只需要是 panic 消息的子字符串:

```rust
pub fn validate_age(age: i32) {
    if age < 0 {
        panic!("年龄不能为负数: {}", age);
    }
    if age > 150 {
        panic!("年龄不能超过150: {}", age);
    }
}

#[test]
#[should_panic(expected = "年龄不能为负数")]
fn test_negative_age() {
    validate_age(-5);
}

#[test]
#[should_panic(expected = "年龄不能超过150")]
fn test_age_too_high() {
    validate_age(200);
}
```

### `#[ignore]` 属性

忽略某些测试(例如耗时测试):

```rust
#[test]
fn quick_test() {
    assert_eq!(2 + 2, 4);
}

#[test]
#[ignore]
fn expensive_test() {
    // 这个测试需要运行很长时间
    std::thread::sleep(std::time::Duration::from_secs(10));
    assert!(true);
}

#[test]
#[ignore = "需要外部数据库连接"]
fn database_test() {
    // 需要数据库的测试
}
```

运行被忽略的测试:

```bash
# 只运行被忽略的测试
cargo test -- --ignored

# 运行所有测试(包括被忽略的)
cargo test -- --include-ignored
```

## 集成测试

集成测试位于项目根目录的 `tests` 目录中,从外部视角测试库的公共 API。

### 创建集成测试

```
my_project/
├── Cargo.toml
├── src/
│   └── lib.rs
└── tests/
    ├── integration_test.rs
    └── common/
        └── mod.rs
```

```rust
// src/lib.rs
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn multiply(a: i32, b: i32) -> i32 {
    a * b
}
```

```rust
// tests/integration_test.rs
use my_project::{add, multiply};

#[test]
fn test_add() {
    assert_eq!(add(2, 3), 5);
}

#[test]
fn test_multiply() {
    assert_eq!(multiply(4, 5), 20);
}

#[test]
fn test_combined_operations() {
    let sum = add(2, 3);
    let product = multiply(sum, 4);
    assert_eq!(product, 20);
}
```

### 共享测试辅助代码

在 `tests/common/mod.rs` 中放置共享代码:

```rust
// tests/common/mod.rs
pub fn setup() {
    println!("执行测试设置...");
}

pub fn create_test_data() -> Vec<i32> {
    vec![1, 2, 3, 4, 5]
}

pub struct TestContext {
    pub data: Vec<i32>,
}

impl TestContext {
    pub fn new() -> Self {
        TestContext {
            data: create_test_data(),
        }
    }
}
```

```rust
// tests/integration_test.rs
mod common;

use my_project::add;

#[test]
fn test_with_setup() {
    common::setup();
    let ctx = common::TestContext::new();

    let sum: i32 = ctx.data.iter().sum();
    assert_eq!(sum, 15);
}
```

### 子目录组织

可以将集成测试组织到子目录中:

```
tests/
├── api/
│   ├── mod.rs
│   ├── users_test.rs
│   └── products_test.rs
└── integration_test.rs
```

```rust
// tests/api/mod.rs
mod users_test;
mod products_test;
```

### 二进制 crate 的集成测试

如果项目只有 `src/main.rs` 而没有 `src/lib.rs`,无法直接创建集成测试。推荐的做法是将逻辑放在 `src/lib.rs` 中:

```rust
// src/lib.rs
pub fn run(args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
    // 主要逻辑
    Ok(())
}
```

```rust
// src/main.rs
use my_project::run;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if let Err(e) = run(&args) {
        eprintln!("错误: {}", e);
        std::process::exit(1);
    }
}
```

这样就可以对 `lib.rs` 中的逻辑进行集成测试了。

## 文档测试

Rust 可以运行文档注释中的代码示例作为测试,确保文档与代码保持同步。

### 基本文档测试

```rust
/// 将两个数相加。
///
/// # 示例
///
/// ```
/// let result = my_crate::add(2, 3);
/// assert_eq!(result, 5);
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

/// 创建一个新的字符串,首字母大写。
///
/// # 示例
///
/// ```
/// let result = my_crate::capitalize("hello");
/// assert_eq!(result, "Hello");
/// ```
///
/// # 边界情况
///
/// ```
/// let empty = my_crate::capitalize("");
/// assert_eq!(empty, "");
///
/// let single = my_crate::capitalize("a");
/// assert_eq!(single, "A");
/// ```
pub fn capitalize(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        None => String::new(),
        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
    }
}
```

### 隐藏文档测试中的代码

使用 `#` 前缀隐藏设置代码:

```rust
/// 解析配置文件。
///
/// # 示例
///
/// ```
/// # use std::collections::HashMap;
/// # fn main() -> Result<(), Box<dyn std::error::Error>> {
/// let config = my_crate::parse_config("key=value")?;
/// assert_eq!(config.get("key"), Some(&"value".to_string()));
/// # Ok(())
/// # }
/// ```
pub fn parse_config(input: &str) -> Result<std::collections::HashMap<String, String>, &'static str> {
    let mut map = std::collections::HashMap::new();
    for line in input.lines() {
        let parts: Vec<&str> = line.splitn(2, '=').collect();
        if parts.len() != 2 {
            return Err("无效的配置格式");
        }
        map.insert(parts[0].to_string(), parts[1].to_string());
    }
    Ok(map)
}
```

### 文档测试属性

```rust
/// 这个示例展示代码不会编译(用于说明错误情况)。
///
/// ```compile_fail
/// let x: i32 = "not a number";
/// ```
pub fn demo_compile_fail() {}

/// 这个示例应该 panic。
///
/// ```should_panic
/// panic!("这会 panic!");
/// ```
pub fn demo_should_panic() {}

/// 这个示例只用于展示,不会被执行。
///
/// ```no_run
/// loop {
///     // 无限循环,不应该运行
///     std::thread::sleep(std::time::Duration::from_secs(1));
/// }
/// ```
pub fn demo_no_run() {}

/// 这段代码被忽略。
///
/// ```ignore
/// // 这段代码不会被测试
/// unimplemented!()
/// ```
pub fn demo_ignore() {}
```

### 指定 crate 名称

当 crate 名称包含连字符时:

```rust
/// ```
/// use my_crate::function; // crate 名称: my-crate
/// ```
```

## 测试配置与运行

### 运行特定测试

```bash
# 运行所有测试
cargo test

# 运行名称包含特定字符串的测试
cargo test add
cargo test test_multiply

# 运行特定模块的测试
cargo test tests::

# 运行单个测试
cargo test tests::test_add
```

### 控制测试输出

```bash
# 显示测试中的 println! 输出
cargo test -- --show-output

# 显示成功测试的输出(默认只显示失败)
cargo test -- --nocapture

# 限制并行测试数量
cargo test -- --test-threads=1
```

### 测试过滤

```bash
# 运行单元测试
cargo test --lib

# 运行集成测试
cargo test --test integration_test

# 运行所有集成测试
cargo test --tests

# 运行文档测试
cargo test --doc

# 运行特定二进制的测试
cargo test --bin my_binary
```

### 发布模式测试

```bash
# 在发布模式下运行测试(更快,但没有调试信息)
cargo test --release
```

## 测试夹具(Fixtures)

### 使用构造函数和析构函数

```rust
struct TestDatabase {
    connection: String,
}

impl TestDatabase {
    fn new() -> Self {
        println!("创建测试数据库连接");
        TestDatabase {
            connection: String::from("test_db"),
        }
    }

    fn query(&self, sql: &str) -> Vec<String> {
        println!("执行查询: {}", sql);
        vec![String::from("result")]
    }
}

impl Drop for TestDatabase {
    fn drop(&mut self) {
        println!("关闭测试数据库连接");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_query() {
        let db = TestDatabase::new();
        let results = db.query("SELECT * FROM users");
        assert!(!results.is_empty());
        // db 在这里被自动 drop
    }
}
```

### 使用宏简化测试设置

```rust
macro_rules! test_with_setup {
    ($name:ident, $body:expr) => {
        #[test]
        fn $name() {
            // 设置
            let _guard = TestSetup::new();

            // 执行测试
            $body
        }
    };
}

struct TestSetup;

impl TestSetup {
    fn new() -> Self {
        println!("测试设置");
        TestSetup
    }
}

impl Drop for TestSetup {
    fn drop(&mut self) {
        println!("测试清理");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    test_with_setup!(test_example, {
        assert!(true);
    });
}
```

## Mocking(模拟)

Rust 标准库不提供 mocking 框架,但有多个社区 crate 可用。

### 使用 trait 实现手动模拟

```rust
// 定义 trait
pub trait EmailSender {
    fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), String>;
}

// 生产实现
pub struct SmtpEmailSender {
    server: String,
}

impl SmtpEmailSender {
    pub fn new(server: &str) -> Self {
        SmtpEmailSender {
            server: server.to_string(),
        }
    }
}

impl EmailSender for SmtpEmailSender {
    fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), String> {
        // 实际发送邮件的逻辑
        println!("通过 {} 发送邮件到 {}", self.server, to);
        Ok(())
    }
}

// 使用 trait 的服务
pub struct NotificationService<T: EmailSender> {
    sender: T,
}

impl<T: EmailSender> NotificationService<T> {
    pub fn new(sender: T) -> Self {
        NotificationService { sender }
    }

    pub fn notify_user(&self, email: &str, message: &str) -> Result<(), String> {
        self.sender.send(email, "通知", message)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;

    // 测试用的 Mock 实现
    struct MockEmailSender {
        sent_emails: RefCell<Vec<(String, String, String)>>,
        should_fail: bool,
    }

    impl MockEmailSender {
        fn new() -> Self {
            MockEmailSender {
                sent_emails: RefCell::new(Vec::new()),
                should_fail: false,
            }
        }

        fn with_failure() -> Self {
            MockEmailSender {
                sent_emails: RefCell::new(Vec::new()),
                should_fail: true,
            }
        }

        fn get_sent_emails(&self) -> Vec<(String, String, String)> {
            self.sent_emails.borrow().clone()
        }
    }

    impl EmailSender for MockEmailSender {
        fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), String> {
            if self.should_fail {
                return Err("模拟发送失败".to_string());
            }
            self.sent_emails
                .borrow_mut()
                .push((to.to_string(), subject.to_string(), body.to_string()));
            Ok(())
        }
    }

    #[test]
    fn test_notification_service_sends_email() {
        let mock_sender = MockEmailSender::new();
        let service = NotificationService::new(mock_sender);

        let result = service.notify_user("test@example.com", "Hello!");

        assert!(result.is_ok());
    }

    #[test]
    fn test_notification_service_records_email() {
        let mock_sender = MockEmailSender::new();
        let service = NotificationService::new(mock_sender);

        service.notify_user("test@example.com", "Hello!").unwrap();

        // 由于所有权转移,需要重新获取 mock
        // 在实际场景中可能需要使用 Arc<MockEmailSender>
    }

    #[test]
    fn test_notification_service_handles_failure() {
        let mock_sender = MockEmailSender::with_failure();
        let service = NotificationService::new(mock_sender);

        let result = service.notify_user("test@example.com", "Hello!");

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "模拟发送失败");
    }
}
```

### 使用 mockall crate

`mockall` 是一个流行的自动 mocking 库:

```rust
// Cargo.toml
// [dev-dependencies]
// mockall = "0.11"

use mockall::{automock, predicate::*};

#[automock]
pub trait Database {
    fn get(&self, id: u32) -> Option<String>;
    fn save(&mut self, id: u32, value: &str) -> Result<(), String>;
}

pub struct UserService<D: Database> {
    db: D,
}

impl<D: Database> UserService<D> {
    pub fn new(db: D) -> Self {
        UserService { db }
    }

    pub fn get_user_name(&self, id: u32) -> Option<String> {
        self.db.get(id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_user_name_found() {
        let mut mock_db = MockDatabase::new();

        mock_db
            .expect_get()
            .with(eq(1))
            .times(1)
            .returning(|_| Some("Alice".to_string()));

        let service = UserService::new(mock_db);
        let name = service.get_user_name(1);

        assert_eq!(name, Some("Alice".to_string()));
    }

    #[test]
    fn test_get_user_name_not_found() {
        let mut mock_db = MockDatabase::new();

        mock_db
            .expect_get()
            .with(eq(999))
            .times(1)
            .returning(|_| None);

        let service = UserService::new(mock_db);
        let name = service.get_user_name(999);

        assert_eq!(name, None);
    }
}
```

## 属性测试(Property-Based Testing)

使用 `proptest` 或 `quickcheck` 进行属性测试:

```rust
// Cargo.toml
// [dev-dependencies]
// proptest = "1.0"

use proptest::prelude::*;

fn reverse<T: Clone>(xs: &[T]) -> Vec<T> {
    xs.iter().rev().cloned().collect()
}

proptest! {
    #[test]
    fn test_reverse_twice_is_identity(ref xs in prop::collection::vec(any::<i32>(), 0..100)) {
        let reversed_twice = reverse(&reverse(xs));
        prop_assert_eq!(&reversed_twice, xs);
    }

    #[test]
    fn test_reverse_preserves_length(ref xs in prop::collection::vec(any::<i32>(), 0..100)) {
        prop_assert_eq!(reverse(xs).len(), xs.len());
    }

    #[test]
    fn test_addition_is_commutative(a in any::<i32>(), b in any::<i32>()) {
        // 使用 wrapping_add 避免溢出
        prop_assert_eq!(a.wrapping_add(b), b.wrapping_add(a));
    }
}
```

## 基准测试(Benchmarking)

### 使用 criterion

```rust
// Cargo.toml
// [dev-dependencies]
// criterion = "0.5"
//
// [[bench]]
// name = "my_benchmark"
// harness = false

// benches/my_benchmark.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn fibonacci(n: u64) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn fibonacci_iterative(n: u64) -> u64 {
    if n == 0 {
        return 0;
    }
    let mut a = 0;
    let mut b = 1;
    for _ in 1..n {
        let temp = a + b;
        a = b;
        b = temp;
    }
    b
}

fn criterion_benchmark(c: &mut Criterion) {
    c.bench_function("fib 20 recursive", |b| {
        b.iter(|| fibonacci(black_box(20)))
    });

    c.bench_function("fib 20 iterative", |b| {
        b.iter(|| fibonacci_iterative(black_box(20)))
    });

    // 比较两个实现
    let mut group = c.benchmark_group("Fibonacci Comparison");
    for i in [10, 15, 20].iter() {
        group.bench_with_input(format!("recursive {}", i), i, |b, i| {
            b.iter(|| fibonacci(*i))
        });
        group.bench_with_input(format!("iterative {}", i), i, |b, i| {
            b.iter(|| fibonacci_iterative(*i))
        });
    }
    group.finish();
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
```

运行基准测试:

```bash
cargo bench
```

## 代码覆盖率

### 使用 tarpaulin

```bash
# 安装 tarpaulin
cargo install cargo-tarpaulin

# 运行覆盖率分析
cargo tarpaulin

# 生成 HTML 报告
cargo tarpaulin --out Html

# 排除某些文件
cargo tarpaulin --exclude-files src/main.rs
```

### 使用 llvm-cov

```bash
# 安装组件
rustup component add llvm-tools-preview
cargo install cargo-llvm-cov

# 运行覆盖率
cargo llvm-cov

# 生成 HTML 报告
cargo llvm-cov --html
```

## 测试最佳实践

### 测试命名

使用描述性的测试名称,说明测试的场景和预期行为:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    // 好的命名
    #[test]
    fn divide_returns_quotient_when_divisor_is_nonzero() {}

    #[test]
    fn divide_returns_error_when_divisor_is_zero() {}

    #[test]
    fn parse_config_succeeds_with_valid_input() {}

    #[test]
    fn parse_config_fails_when_missing_equals_sign() {}

    // 避免的命名
    #[test]
    fn test1() {} // 太模糊

    #[test]
    fn it_works() {} // 不够具体
}
```

### AAA 模式

遵循 Arrange-Act-Assert 模式:

```rust
#[test]
fn user_can_update_email() {
    // Arrange: 设置测试数据
    let mut user = User::new("alice", "alice@old.com");

    // Act: 执行被测操作
    user.update_email("alice@new.com");

    // Assert: 验证结果
    assert_eq!(user.email(), "alice@new.com");
}
```

### 测试边界条件

```rust
pub fn parse_port(s: &str) -> Result<u16, &'static str> {
    s.parse::<u16>().map_err(|_| "无效的端口号")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_port_minimum_valid() {
        assert_eq!(parse_port("0"), Ok(0));
    }

    #[test]
    fn parse_port_maximum_valid() {
        assert_eq!(parse_port("65535"), Ok(65535));
    }

    #[test]
    fn parse_port_above_maximum() {
        assert!(parse_port("65536").is_err());
    }

    #[test]
    fn parse_port_negative() {
        assert!(parse_port("-1").is_err());
    }

    #[test]
    fn parse_port_empty_string() {
        assert!(parse_port("").is_err());
    }

    #[test]
    fn parse_port_non_numeric() {
        assert!(parse_port("abc").is_err());
    }
}
```

### 避免测试实现细节

测试行为而非实现:

```rust
pub struct Counter {
    // 私有实现细节
    count: i32,
}

impl Counter {
    pub fn new() -> Self {
        Counter { count: 0 }
    }

    pub fn increment(&mut self) {
        self.count += 1;
    }

    pub fn value(&self) -> i32 {
        self.count
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // 好: 测试行为
    #[test]
    fn counter_starts_at_zero() {
        let counter = Counter::new();
        assert_eq!(counter.value(), 0);
    }

    #[test]
    fn counter_increments_by_one() {
        let mut counter = Counter::new();
        counter.increment();
        assert_eq!(counter.value(), 1);
    }

    // 避免: 测试实现细节
    // #[test]
    // fn counter_uses_i32_internally() {
    //     let counter = Counter::new();
    //     assert_eq!(counter.count, 0); // 直接访问私有字段
    // }
}
```

## 异步测试

### 使用 tokio

```rust
// Cargo.toml
// [dev-dependencies]
// tokio = { version = "1", features = ["full", "test-util"] }

use tokio::time::{sleep, Duration};

async fn fetch_data() -> String {
    sleep(Duration::from_millis(100)).await;
    "data".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_fetch_data() {
        let result = fetch_data().await;
        assert_eq!(result, "data");
    }

    #[tokio::test]
    async fn test_concurrent_operations() {
        let (a, b) = tokio::join!(fetch_data(), fetch_data());
        assert_eq!(a, "data");
        assert_eq!(b, "data");
    }
}
```

### 使用 async-std

```rust
// Cargo.toml
// [dev-dependencies]
// async-std = { version = "1", features = ["attributes"] }

#[cfg(test)]
mod tests {
    use super::*;

    #[async_std::test]
    async fn test_async_operation() {
        let result = async_operation().await;
        assert!(result.is_ok());
    }
}
```

## 综合示例

下面是一个完整的测试示例,展示了各种测试技术:

```rust
// src/lib.rs

/// 一个简单的购物车实现
pub mod shopping_cart {
    use std::collections::HashMap;

    #[derive(Debug, Clone, PartialEq)]
    pub struct Product {
        pub id: u32,
        pub name: String,
        pub price: f64,
    }

    #[derive(Debug)]
    pub struct Cart {
        items: HashMap<u32, (Product, u32)>, // product_id -> (product, quantity)
    }

    impl Cart {
        /// 创建一个新的空购物车。
        ///
        /// # 示例
        ///
        /// ```
        /// use my_crate::shopping_cart::Cart;
        ///
        /// let cart = Cart::new();
        /// assert!(cart.is_empty());
        /// ```
        pub fn new() -> Self {
            Cart {
                items: HashMap::new(),
            }
        }

        /// 检查购物车是否为空。
        pub fn is_empty(&self) -> bool {
            self.items.is_empty()
        }

        /// 添加商品到购物车。
        ///
        /// # 示例
        ///
        /// ```
        /// use my_crate::shopping_cart::{Cart, Product};
        ///
        /// let mut cart = Cart::new();
        /// let product = Product {
        ///     id: 1,
        ///     name: "苹果".to_string(),
        ///     price: 5.0,
        /// };
        ///
        /// cart.add_product(product, 3);
        /// assert_eq!(cart.item_count(), 3);
        /// ```
        pub fn add_product(&mut self, product: Product, quantity: u32) {
            let entry = self.items.entry(product.id).or_insert((product, 0));
            entry.1 += quantity;
        }

        /// 从购物车移除商品。
        pub fn remove_product(&mut self, product_id: u32) -> Option<(Product, u32)> {
            self.items.remove(&product_id)
        }

        /// 获取购物车中的商品总数。
        pub fn item_count(&self) -> u32 {
            self.items.values().map(|(_, qty)| qty).sum()
        }

        /// 计算购物车总价。
        pub fn total(&self) -> f64 {
            self.items
                .values()
                .map(|(product, qty)| product.price * (*qty as f64))
                .sum()
        }

        /// 应用折扣。
        ///
        /// # Panics
        ///
        /// 如果折扣百分比不在 0-100 之间,会 panic。
        pub fn apply_discount(&mut self, percentage: f64) -> f64 {
            if percentage < 0.0 || percentage > 100.0 {
                panic!("折扣百分比必须在 0-100 之间");
            }
            self.total() * (1.0 - percentage / 100.0)
        }

        /// 获取所有商品。
        pub fn items(&self) -> Vec<(&Product, u32)> {
            self.items.values().map(|(p, q)| (p, *q)).collect()
        }
    }

    impl Default for Cart {
        fn default() -> Self {
            Self::new()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::shopping_cart::*;

    // 辅助函数创建测试商品
    fn create_apple() -> Product {
        Product {
            id: 1,
            name: "苹果".to_string(),
            price: 5.0,
        }
    }

    fn create_banana() -> Product {
        Product {
            id: 2,
            name: "香蕉".to_string(),
            price: 3.0,
        }
    }

    mod cart_creation {
        use super::*;

        #[test]
        fn new_cart_is_empty() {
            let cart = Cart::new();
            assert!(cart.is_empty());
            assert_eq!(cart.item_count(), 0);
            assert_eq!(cart.total(), 0.0);
        }

        #[test]
        fn default_cart_is_empty() {
            let cart = Cart::default();
            assert!(cart.is_empty());
        }
    }

    mod adding_products {
        use super::*;

        #[test]
        fn add_single_product() {
            let mut cart = Cart::new();
            cart.add_product(create_apple(), 1);

            assert!(!cart.is_empty());
            assert_eq!(cart.item_count(), 1);
        }

        #[test]
        fn add_multiple_of_same_product() {
            let mut cart = Cart::new();
            cart.add_product(create_apple(), 3);

            assert_eq!(cart.item_count(), 3);
        }

        #[test]
        fn add_same_product_multiple_times_accumulates() {
            let mut cart = Cart::new();
            cart.add_product(create_apple(), 2);
            cart.add_product(create_apple(), 3);

            assert_eq!(cart.item_count(), 5);
        }

        #[test]
        fn add_different_products() {
            let mut cart = Cart::new();
            cart.add_product(create_apple(), 2);
            cart.add_product(create_banana(), 3);

            assert_eq!(cart.item_count(), 5);
        }
    }

    mod removing_products {
        use super::*;

        #[test]
        fn remove_existing_product() {
            let mut cart = Cart::new();
            let apple = create_apple();
            cart.add_product(apple.clone(), 3);

            let removed = cart.remove_product(1);

            assert!(removed.is_some());
            let (product, quantity) = removed.unwrap();
            assert_eq!(product, apple);
            assert_eq!(quantity, 3);
            assert!(cart.is_empty());
        }

        #[test]
        fn remove_nonexistent_product_returns_none() {
            let mut cart = Cart::new();
            cart.add_product(create_apple(), 1);

            let removed = cart.remove_product(999);

            assert!(removed.is_none());
            assert_eq!(cart.item_count(), 1);
        }
    }

    mod calculating_total {
        use super::*;

        #[test]
        fn total_with_single_product() {
            let mut cart = Cart::new();
            cart.add_product(create_apple(), 3); // 5.0 * 3

            assert!((cart.total() - 15.0).abs() < f64::EPSILON);
        }

        #[test]
        fn total_with_multiple_products() {
            let mut cart = Cart::new();
            cart.add_product(create_apple(), 2); // 5.0 * 2 = 10.0
            cart.add_product(create_banana(), 4); // 3.0 * 4 = 12.0

            assert!((cart.total() - 22.0).abs() < f64::EPSILON);
        }
    }

    mod applying_discount {
        use super::*;

        #[test]
        fn apply_zero_discount() {
            let mut cart = Cart::new();
            cart.add_product(create_apple(), 2); // 10.0

            let discounted = cart.apply_discount(0.0);

            assert!((discounted - 10.0).abs() < f64::EPSILON);
        }

        #[test]
        fn apply_fifty_percent_discount() {
            let mut cart = Cart::new();
            cart.add_product(create_apple(), 2); // 10.0

            let discounted = cart.apply_discount(50.0);

            assert!((discounted - 5.0).abs() < f64::EPSILON);
        }

        #[test]
        fn apply_full_discount() {
            let mut cart = Cart::new();
            cart.add_product(create_apple(), 2);

            let discounted = cart.apply_discount(100.0);

            assert!((discounted - 0.0).abs() < f64::EPSILON);
        }

        #[test]
        #[should_panic(expected = "折扣百分比必须在 0-100 之间")]
        fn negative_discount_panics() {
            let mut cart = Cart::new();
            cart.add_product(create_apple(), 1);
            cart.apply_discount(-10.0);
        }

        #[test]
        #[should_panic(expected = "折扣百分比必须在 0-100 之间")]
        fn discount_over_100_panics() {
            let mut cart = Cart::new();
            cart.add_product(create_apple(), 1);
            cart.apply_discount(150.0);
        }
    }
}
```

## 总结

Rust 的测试框架提供了强大而灵活的测试能力:

**核心特性:**
- **`#[test]` 属性**: 标记测试函数
- **断言宏**: `assert!`、`assert_eq!`、`assert_ne!` 用于验证
- **测试属性**: `#[should_panic]`、`#[ignore]` 控制测试行为

**测试类型:**
- **单元测试**: 与代码在同一文件,测试内部实现
- **集成测试**: 在 `tests/` 目录,测试公共 API
- **文档测试**: 在文档注释中,确保示例代码正确

**高级特性:**
- **Mocking**: 使用 trait 或 mockall 模拟依赖
- **属性测试**: 使用 proptest 生成随机测试数据
- **基准测试**: 使用 criterion 测量性能
- **代码覆盖率**: 使用 tarpaulin 或 llvm-cov

**最佳实践:**
- 使用描述性的测试名称
- 遵循 AAA(Arrange-Act-Assert)模式
- 测试边界条件和错误情况
- 测试行为而非实现细节
- 保持测试简洁和独立

掌握 Rust 测试将帮助你编写更可靠、更易维护的代码。测试不仅是质量保证的工具,也是设计良好 API 的重要手段。
