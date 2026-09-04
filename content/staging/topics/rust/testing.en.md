---
title: Testing
description: Complete Guide to Rust Testing, Unit Tests, Integration Tests, and Documentation Tests
track: rust
section: cargo-tooling
difficulty: intermediate
tags:
  - Rust
  - 测试
  - 单元测试
  - 集成测试
status: imported
origin: old/src/content/docs/rust/testing.en.md
divergence: 0.202
issues: []
legacy:
  category: Rust
  subcategory: 测试
  order: 12
  lastUpdated: 2026-01-07
---

Testing is an important part of software development, and Rust has a powerful built-in testing framework. It supports three types of tests: unit tests, integration tests, and documentation tests, all of which can be run with a single `cargo test` command. This article will comprehensively introduce all aspects of Rust testing.

## Testing Basics

### The `#[test]` Attribute

In Rust, test functions are marked with the `#[test]` attribute. When running `cargo test`, Rust builds a test runner that executes all functions with this attribute.

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

Running tests:

```bash
$ cargo test
   Compiling mylib v0.1.0
    Finished test [unoptimized + debuginfo] target(s) in 0.72s
     Running unittests src/lib.rs

running 1 test
test test_add ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

### Test Function Requirements

Test functions typically:
- Have no parameters
- Return `()` or `Result<(), E>`
- If the function panics, the test fails; if it returns normally, the test passes

```rust
// Test returning ()
#[test]
fn test_with_unit_return() {
    assert!(true);
}

// Test returning Result (Rust 2018+)
#[test]
fn test_with_result() -> Result<(), String> {
    if 2 + 2 == 4 {
        Ok(())
    } else {
        Err(String::from("Math is broken!"))
    }
}
```

The advantage of using `Result` return type is that you can use the `?` operator to simplify error handling:

```rust
#[test]
fn test_file_parsing() -> Result<(), Box<dyn std::error::Error>> {
    let content = std::fs::read_to_string("test_data.txt")?;
    let parsed: i32 = content.trim().parse()?;
    assert_eq!(parsed, 42);
    Ok(())
}
```

## Assertion Macros

Rust provides several assertion macros for test verification.

### The `assert!` Macro

Verifies that an expression is `true`:

```rust
#[test]
fn test_assert() {
    let x = 5;
    assert!(x > 0);
    assert!(x < 10);
    assert!(x >= 5 && x <= 5);
}
```

### The `assert_eq!` and `assert_ne!` Macros

Compare two values for equality or inequality:

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

`assert_eq!` and `assert_ne!` require the compared values to implement the `PartialEq` and `Debug` traits:

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

### Custom Error Messages

All assertion macros support formatted custom messages:

```rust
pub fn greeting(name: &str) -> String {
    format!("Hello {}!", name)
}

#[test]
fn test_greeting_contains_name() {
    let result = greeting("Carol");
    assert!(
        result.contains("Carol"),
        "Greeting should contain the name, got: `{}`",
        result
    );
}

#[test]
fn test_greeting_format() {
    let result = greeting("Alice");
    assert_eq!(
        result,
        "Hello Alice!",
        "Greeting format is incorrect, name = {}",
        "Alice"
    );
}
```

### The `debug_assert!` Series of Macros

These macros only execute in debug mode and are optimized away by the compiler in release mode:

```rust
fn compute(x: i32) -> i32 {
    debug_assert!(x >= 0, "x must be non-negative");
    x * 2
}

#[test]
fn test_debug_assertions() {
    // Will be checked in test mode (debug)
    assert_eq!(compute(5), 10);
}
```

## Test Organization

### Unit Test Module

By convention, unit tests are placed in the same file as the tested code, using `#[cfg(test)]` conditional compilation:

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
            Err("Divisor cannot be zero")
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
        assert_eq!(result.unwrap_err(), "Divisor cannot be zero");
    }
}
```

Purpose of `#[cfg(test)]`:
- Test code is only compiled when running `cargo test`
- Normal `cargo build` does not include test code
- Reduces the size of production code

### Testing Private Functions

Rust allows testing private functions because the test module is a child module of the parent module:

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
        // Can directly test private functions
        assert_eq!(internal_add(2, 3), 5);
    }

    #[test]
    fn test_public_add() {
        assert_eq!(public_add(2, 3), 5);
    }
}
```

## Test Attributes

### The `#[should_panic]` Attribute

Verifies that code should panic:

```rust
pub fn divide(a: i32, b: i32) -> i32 {
    if b == 0 {
        panic!("Divisor cannot be zero!");
    }
    a / b
}

#[test]
#[should_panic]
fn test_divide_by_zero_panics() {
    divide(10, 0);
}
```

Use the `expected` parameter to verify the panic message:

```rust
#[test]
#[should_panic(expected = "Divisor cannot be zero")]
fn test_divide_by_zero_panics_with_message() {
    divide(10, 0);
}
```

`expected` only needs to be a substring of the panic message:

```rust
pub fn validate_age(age: i32) {
    if age < 0 {
        panic!("Age cannot be negative: {}", age);
    }
    if age > 150 {
        panic!("Age cannot exceed 150: {}", age);
    }
}

#[test]
#[should_panic(expected = "Age cannot be negative")]
fn test_negative_age() {
    validate_age(-5);
}

#[test]
#[should_panic(expected = "Age cannot exceed 150")]
fn test_age_too_high() {
    validate_age(200);
}
```

### The `#[ignore]` Attribute

Ignore certain tests (e.g., time-consuming tests):

```rust
#[test]
fn quick_test() {
    assert_eq!(2 + 2, 4);
}

#[test]
#[ignore]
fn expensive_test() {
    // This test takes a long time to run
    std::thread::sleep(std::time::Duration::from_secs(10));
    assert!(true);
}

#[test]
#[ignore = "requires external database connection"]
fn database_test() {
    // Test requiring database
}
```

Running ignored tests:

```bash
# Run only ignored tests
cargo test -- --ignored

# Run all tests (including ignored)
cargo test -- --include-ignored
```

## Integration Tests

Integration tests are located in the `tests` directory at the project root, testing the library's public API from an external perspective.

### Creating Integration Tests

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

### Sharing Test Helper Code

Place shared code in `tests/common/mod.rs`:

```rust
// tests/common/mod.rs
pub fn setup() {
    println!("Executing test setup...");
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

### Subdirectory Organization

Integration tests can be organized into subdirectories:

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

### Integration Tests for Binary Crates

If the project only has `src/main.rs` without `src/lib.rs`, integration tests cannot be created directly. The recommended approach is to put the logic in `src/lib.rs`:

```rust
// src/lib.rs
pub fn run(args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
    // Main logic
    Ok(())
}
```

```rust
// src/main.rs
use my_project::run;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if let Err(e) = run(&args) {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}
```

This way, the logic in `lib.rs` can be integration tested.

## Documentation Tests

Rust can run code examples in documentation comments as tests, ensuring documentation stays in sync with code.

### Basic Documentation Tests

```rust
/// Adds two numbers together.
///
/// # Examples
///
/// \`\`\`
/// let result = my_crate::add(2, 3);
/// assert_eq!(result, 5);
/// \`\`\`
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

/// Creates a new string with the first letter capitalized.
///
/// # Examples
///
/// \`\`\`
/// let result = my_crate::capitalize("hello");
/// assert_eq!(result, "Hello");
/// \`\`\`
///
/// # Edge Cases
///
/// \`\`\`
/// let empty = my_crate::capitalize("");
/// assert_eq!(empty, "");
///
/// let single = my_crate::capitalize("a");
/// assert_eq!(single, "A");
/// \`\`\`
pub fn capitalize(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        None => String::new(),
        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
    }
}
```

### Hiding Code in Documentation Tests

Use `#` prefix to hide setup code:

```rust
/// Parses a configuration file.
///
/// # Examples
///
/// \`\`\`
/// # use std::collections::HashMap;
/// # fn main() -> Result<(), Box<dyn std::error::Error>> {
/// let config = my_crate::parse_config("key=value")?;
/// assert_eq!(config.get("key"), Some(&"value".to_string()));
/// # Ok(())
/// # }
/// \`\`\`
pub fn parse_config(input: &str) -> Result<std::collections::HashMap<String, String>, &'static str> {
    let mut map = std::collections::HashMap::new();
    for line in input.lines() {
        let parts: Vec<&str> = line.splitn(2, '=').collect();
        if parts.len() != 2 {
            return Err("Invalid configuration format");
        }
        map.insert(parts[0].to_string(), parts[1].to_string());
    }
    Ok(map)
}
```

### Documentation Test Attributes

```rust
/// This example shows code that won't compile (for illustrating error cases).
///
/// \`\`\`compile_fail
/// let x: i32 = "not a number";
/// \`\`\`
pub fn demo_compile_fail() {}

/// This example should panic.
///
/// \`\`\`should_panic
/// panic!("This will panic!");
/// \`\`\`
pub fn demo_should_panic() {}

/// This example is for display only and won't be executed.
///
/// \`\`\`no_run
/// loop {
///     // Infinite loop, should not run
///     std::thread::sleep(std::time::Duration::from_secs(1));
/// }
/// \`\`\`
pub fn demo_no_run() {}

/// This code is ignored.
///
/// \`\`\`ignore
/// // This code won't be tested
/// unimplemented!()
/// \`\`\`
pub fn demo_ignore() {}
```

### Specifying Crate Names

When the crate name contains hyphens:

```rust
/// \`\`\`
/// use my_crate::function; // crate name: my-crate
/// \`\`\`
```

## Test Configuration and Running

### Running Specific Tests

```bash
# Run all tests
cargo test

# Run tests with names containing a specific string
cargo test add
cargo test test_multiply

# Run tests in a specific module
cargo test tests::

# Run a single test
cargo test tests::test_add
```

### Controlling Test Output

```bash
# Show println! output in tests
cargo test -- --show-output

# Show output from successful tests (default only shows failures)
cargo test -- --nocapture

# Limit the number of parallel tests
cargo test -- --test-threads=1
```

### Test Filtering

```bash
# Run unit tests
cargo test --lib

# Run integration tests
cargo test --test integration_test

# Run all integration tests
cargo test --tests

# Run documentation tests
cargo test --doc

# Run tests for a specific binary
cargo test --bin my_binary
```

### Release Mode Testing

```bash
# Run tests in release mode (faster, but no debug info)
cargo test --release
```

## Test Fixtures

### Using Constructors and Destructors

```rust
struct TestDatabase {
    connection: String,
}

impl TestDatabase {
    fn new() -> Self {
        println!("Creating test database connection");
        TestDatabase {
            connection: String::from("test_db"),
        }
    }

    fn query(&self, sql: &str) -> Vec<String> {
        println!("Executing query: {}", sql);
        vec![String::from("result")]
    }
}

impl Drop for TestDatabase {
    fn drop(&mut self) {
        println!("Closing test database connection");
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
        // db is automatically dropped here
    }
}
```

### Using Macros to Simplify Test Setup

```rust
macro_rules! test_with_setup {
    ($name:ident, $body:expr) => {
        #[test]
        fn $name() {
            // Setup
            let _guard = TestSetup::new();

            // Execute test
            $body
        }
    };
}

struct TestSetup;

impl TestSetup {
    fn new() -> Self {
        println!("Test setup");
        TestSetup
    }
}

impl Drop for TestSetup {
    fn drop(&mut self) {
        println!("Test cleanup");
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

## Mocking

Rust's standard library does not provide a mocking framework, but several community crates are available.

### Manual Mocking Using Traits

```rust
// Define trait
pub trait EmailSender {
    fn send(&self, to: &str, subject: &str, body: &str) -> Result<(), String>;
}

// Production implementation
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
        // Actual email sending logic
        println!("Sending email to {} via {}", to, self.server);
        Ok(())
    }
}

// Service using the trait
pub struct NotificationService<T: EmailSender> {
    sender: T,
}

impl<T: EmailSender> NotificationService<T> {
    pub fn new(sender: T) -> Self {
        NotificationService { sender }
    }

    pub fn notify_user(&self, email: &str, message: &str) -> Result<(), String> {
        self.sender.send(email, "Notification", message)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;

    // Mock implementation for testing
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
                return Err("Simulated send failure".to_string());
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

        // Due to ownership transfer, need to re-obtain the mock
        // In real scenarios, Arc<MockEmailSender> might be needed
    }

    #[test]
    fn test_notification_service_handles_failure() {
        let mock_sender = MockEmailSender::with_failure();
        let service = NotificationService::new(mock_sender);

        let result = service.notify_user("test@example.com", "Hello!");

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Simulated send failure");
    }
}
```

### Using the mockall Crate

`mockall` is a popular automatic mocking library:

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

## Property-Based Testing

Use `proptest` or `quickcheck` for property-based testing:

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
        // Use wrapping_add to avoid overflow
        prop_assert_eq!(a.wrapping_add(b), b.wrapping_add(a));
    }
}
```

## Benchmarking

### Using Criterion

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

    // Compare two implementations
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

Running benchmarks:

```bash
cargo bench
```

## Code Coverage

### Using tarpaulin

```bash
# Install tarpaulin
cargo install cargo-tarpaulin

# Run coverage analysis
cargo tarpaulin

# Generate HTML report
cargo tarpaulin --out Html

# Exclude certain files
cargo tarpaulin --exclude-files src/main.rs
```

### Using llvm-cov

```bash
# Install components
rustup component add llvm-tools-preview
cargo install cargo-llvm-cov

# Run coverage
cargo llvm-cov

# Generate HTML report
cargo llvm-cov --html
```

## Testing Best Practices

### Test Naming

Use descriptive test names that describe the scenario and expected behavior:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    // Good naming
    #[test]
    fn divide_returns_quotient_when_divisor_is_nonzero() {}

    #[test]
    fn divide_returns_error_when_divisor_is_zero() {}

    #[test]
    fn parse_config_succeeds_with_valid_input() {}

    #[test]
    fn parse_config_fails_when_missing_equals_sign() {}

    // Naming to avoid
    #[test]
    fn test1() {} // Too vague

    #[test]
    fn it_works() {} // Not specific enough
}
```

### AAA Pattern

Follow the Arrange-Act-Assert pattern:

```rust
#[test]
fn user_can_update_email() {
    // Arrange: set up test data
    let mut user = User::new("alice", "alice@old.com");

    // Act: perform the operation under test
    user.update_email("alice@new.com");

    // Assert: verify the result
    assert_eq!(user.email(), "alice@new.com");
}
```

### Testing Boundary Conditions

```rust
pub fn parse_port(s: &str) -> Result<u16, &'static str> {
    s.parse::<u16>().map_err(|_| "Invalid port number")
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

### Avoid Testing Implementation Details

Test behavior, not implementation:

```rust
pub struct Counter {
    // Private implementation detail
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

    // Good: testing behavior
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

    // Avoid: testing implementation details
    // #[test]
    // fn counter_uses_i32_internally() {
    //     let counter = Counter::new();
    //     assert_eq!(counter.count, 0); // Directly accessing private field
    // }
}
```

## Async Tests

### Using tokio

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

### Using async-std

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

## Comprehensive Example

The following complete test example demonstrates various testing techniques:

```rust
// src/lib.rs

/// A simple shopping cart implementation
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
        /// Creates a new empty shopping cart.
        ///
        /// # Examples
        ///
        /// \`\`\`
        /// use my_crate::shopping_cart::Cart;
        ///
        /// let cart = Cart::new();
        /// assert!(cart.is_empty());
        /// \`\`\`
        pub fn new() -> Self {
            Cart {
                items: HashMap::new(),
            }
        }

        /// Checks if the shopping cart is empty.
        pub fn is_empty(&self) -> bool {
            self.items.is_empty()
        }

        /// Adds a product to the shopping cart.
        ///
        /// # Examples
        ///
        /// \`\`\`
        /// use my_crate::shopping_cart::{Cart, Product};
        ///
        /// let mut cart = Cart::new();
        /// let product = Product {
        ///     id: 1,
        ///     name: "Apple".to_string(),
        ///     price: 5.0,
        /// };
        ///
        /// cart.add_product(product, 3);
        /// assert_eq!(cart.item_count(), 3);
        /// \`\`\`
        pub fn add_product(&mut self, product: Product, quantity: u32) {
            let entry = self.items.entry(product.id).or_insert((product, 0));
            entry.1 += quantity;
        }

        /// Removes a product from the shopping cart.
        pub fn remove_product(&mut self, product_id: u32) -> Option<(Product, u32)> {
            self.items.remove(&product_id)
        }

        /// Gets the total number of items in the cart.
        pub fn item_count(&self) -> u32 {
            self.items.values().map(|(_, qty)| qty).sum()
        }

        /// Calculates the total price of the cart.
        pub fn total(&self) -> f64 {
            self.items
                .values()
                .map(|(product, qty)| product.price * (*qty as f64))
                .sum()
        }

        /// Applies a discount.
        ///
        /// # Panics
        ///
        /// Panics if the discount percentage is not between 0-100.
        pub fn apply_discount(&mut self, percentage: f64) -> f64 {
            if percentage < 0.0 || percentage > 100.0 {
                panic!("Discount percentage must be between 0-100");
            }
            self.total() * (1.0 - percentage / 100.0)
        }

        /// Gets all products.
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

    // Helper function to create test products
    fn create_apple() -> Product {
        Product {
            id: 1,
            name: "Apple".to_string(),
            price: 5.0,
        }
    }

    fn create_banana() -> Product {
        Product {
            id: 2,
            name: "Banana".to_string(),
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
        #[should_panic(expected = "Discount percentage must be between 0-100")]
        fn negative_discount_panics() {
            let mut cart = Cart::new();
            cart.add_product(create_apple(), 1);
            cart.apply_discount(-10.0);
        }

        #[test]
        #[should_panic(expected = "Discount percentage must be between 0-100")]
        fn discount_over_100_panics() {
            let mut cart = Cart::new();
            cart.add_product(create_apple(), 1);
            cart.apply_discount(150.0);
        }
    }
}
```

## Summary

Rust's testing framework provides powerful and flexible testing capabilities:

**Core Features:**
- **`#[test]` attribute**: Marks test functions
- **Assertion macros**: `assert!`, `assert_eq!`, `assert_ne!` for verification
- **Test attributes**: `#[should_panic]`, `#[ignore]` to control test behavior

**Test Types:**
- **Unit tests**: In the same file as the code, testing internal implementation
- **Integration tests**: In `tests/` directory, testing public API
- **Documentation tests**: In doc comments, ensuring example code is correct

**Advanced Features:**
- **Mocking**: Using traits or mockall to simulate dependencies
- **Property testing**: Using proptest to generate random test data
- **Benchmarking**: Using criterion to measure performance
- **Code coverage**: Using tarpaulin or llvm-cov

**Best Practices:**
- Use descriptive test names
- Follow the AAA (Arrange-Act-Assert) pattern
- Test boundary conditions and error cases
- Test behavior, not implementation details
- Keep tests concise and independent

With Rust testing, you can write more reliable and maintainable code. Testing is a tool for quality assurance and an important means of designing good APIs.
