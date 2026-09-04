---
title: Rust Option and Result Types for Error Handling
description: Comprehensive guide to Rust's Option<T> and Result<T, E> types for safe error handling. Covers core concepts, usage patterns, best practices, and real-world scenarios for robust Rust applications.
track: rust
section: error-handling
difficulty: intermediate
tags:
  - error-handling
  - option
  - result
  - rust
  - type-safety
  - pattern-matching
status: imported
origin: old/src/content/docs/rust/option-result.en.md
divergence: 0.227
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Rust
  subcategory: ""
  order: 4
  lastUpdated: 2026-01-07
---

## Concept Explanation

In Rust, error handling is fundamentally different from languages with exceptions. Rather than using try-catch blocks or returning error codes, Rust provides two powerful enumeration types that encode success and failure directly in the type system: `Option<T>` and `Result<T, E>`.

**Option<T>** represents the possibility of absence. It has two variants:
- `Some(T)` - contains a value
- `None` - represents the absence of a value

**Result<T, E>** represents the possibility of failure. It has two variants:
- `Ok(T)` - contains a success value
- `Err(E)` - contains an error value

These types make error handling explicit and compile-time verifiable. You cannot accidentally ignore an error or work with a potentially absent value without handling it. This approach eliminates entire classes of runtime errors that plague other languages.

The philosophy behind these types stems from Rust's commitment to memory safety and correctness. By encoding failure states in the type system, the compiler ensures all code paths are properly handled before the program runs.

## Core Principles

### Explicit Error Handling

Every operation that can fail returns a `Result` or `Option`, forcing developers to handle both success and failure cases. This eliminates silent failures and null pointer exceptions.

```rust
// You MUST handle both cases
let file = std::fs::read_to_string("config.txt");
// Compiler error if you try to use file without handling Result

// Proper handling required
match file {
    Ok(contents) => println!("{}", contents),
    Err(e) => eprintln!("Error: {}", e),
}
```

### Composability Through Combinators

Rather than nested conditionals, Rust provides combinators that chain operations elegantly. Methods like `map()`, `and_then()`, `unwrap_or()`, and `?` operator allow you to work with values without explicit branching.

```rust
// Chaining operations
let result = some_fallible_operation()
    .map(|value| value * 2)
    .and_then(|value| another_operation(value))
    .unwrap_or_default();
```

### Type Safety and Compiler Verification

The Rust compiler verifies that all variants are handled before code compiles. You cannot write code that assumes success when failure is possible.

```rust
// Compiler prevents unsafe assumptions
let value: Option<i32> = get_option();

// Compiler error: cannot add Option<i32> to i32
// let result = value + 5;  // ❌ Compilation error

// Explicit handling required
let result = match value {
    Some(n) => n + 5,
    None => 0,
};
```

### Lazy Evaluation and Short-Circuiting

Operations using `?` operator and combinators provide short-circuit evaluation, stopping execution at the first error.

```rust
fn process() -> Result<String, Error> {
    let file_content = std::fs::read_to_string("file.txt")?;  // Returns early if error
    let parsed = parse_json(&file_content)?;  // Returns early if error
    Ok(parsed)  // Only reached if all operations succeed
}
```

## Key Points

### Option<T> Fundamentals

- **Use Case**: When a value may or may not exist
- **Variants**: `Some(T)` for presence, `None` for absence
- **Common Operations**: `is_some()`, `is_none()`, `unwrap()`, `unwrap_or()`, `map()`, `filter()`

```rust
let maybe_number: Option<i32> = Some(5);

// Check variant
assert!(maybe_number.is_some());
assert!(!maybe_number.is_none());

// Get value
let value = maybe_number.unwrap();  // 5
let value = maybe_number.unwrap_or(0);  // 5

// Transform
let doubled = maybe_number.map(|n| n * 2);  // Some(10)
```

### Result<T, E> Fundamentals

- **Use Case**: When an operation can fail for a specific reason
- **Variants**: `Ok(T)` for success, `Err(E)` for failure
- **Error Type**: Generic E allows custom error types
- **Common Operations**: `is_ok()`, `is_err()`, `ok()`, `err()`, `map()`, `map_err()`, `?`

```rust
let result: Result<i32, String> = Ok(42);

// Check variant
assert!(result.is_ok());
assert!(!result.is_err());

// Extract variants
let value = result.ok();  // Option<i32>
let error = result.err();  // Option<String>

// Transform
let doubled = result.map(|n| n * 2);  // Ok(84)
let with_context = result.map_err(|e| format!("Error: {}", e));
```

### The Question Mark Operator

The `?` operator provides syntactic sugar for propagating errors. It returns early with the error if the operation fails, otherwise extracts the success value.

```rust
fn process_file(path: &str) -> Result<String, Box<dyn std::error::Error>> {
    let content = std::fs::read_to_string(path)?;  // Returns early on error
    let upper = content.to_uppercase();  // Only reached if read succeeds
    Ok(upper)
}

// Equivalent to:
fn process_file_verbose(path: &str) -> Result<String, Box<dyn std::error::Error>> {
    let content = match std::fs::read_to_string(path) {
        Ok(c) => c,
        Err(e) => return Err(e.into()),
    };
    let upper = content.to_uppercase();
    Ok(upper)
}
```

### Unwrapping Operations

While powerful, unwrapping operations should be used carefully:

- **unwrap()** - Panics if None/Err
- **expect(msg)** - Panics with custom message
- **unwrap_or(default)** - Returns default value
- **unwrap_or_default()** - Returns T::default()
- **unwrap_or_else(closure)** - Computes default lazily

## Code Examples

### Basic Option Handling

```rust
fn find_user(id: u32) -> Option<String> {
    match id {
        1 => Some("Alice".to_string()),
        2 => Some("Bob".to_string()),
        _ => None,
    }
}

fn main() {
    // Pattern matching
    match find_user(1) {
        Some(name) => println!("Found: {}", name),
        None => println!("User not found"),
    }

    // if let (concise)
    if let Some(name) = find_user(2) {
        println!("Hello, {}", name);
    }

    // while let (loops over sequences)
    let mut values = vec![Some(1), Some(2), None, Some(3)];
    while let Some(value) = values.pop() {
        println!("Value: {}", value);
    }

    // Combinators
    let user = find_user(1)
        .map(|name| name.to_uppercase())
        .filter(|name| name.contains("A"))
        .unwrap_or_else(|| "Unknown".to_string());
    println!("{}", user);  // ALICE
}
```

### Intermediate Result Handling

```rust
use std::fs;
use std::io;
use std::num::ParseIntError;

#[derive(Debug)]
enum CustomError {
    IoError(io::Error),
    ParseError(ParseIntError),
    InvalidData(String),
}

impl From<io::Error> for CustomError {
    fn from(err: io::Error) -> Self {
        CustomError::IoError(err)
    }
}

impl From<ParseIntError> for CustomError {
    fn from(err: ParseIntError) -> Self {
        CustomError::ParseError(err)
    }
}

fn read_and_parse_number(filename: &str) -> Result<i32, CustomError> {
    // ? operator works with the From trait
    let contents = fs::read_to_string(filename)?;
    let number = contents.trim().parse::<i32>()?;

    if number < 0 {
        return Err(CustomError::InvalidData(
            "Number must be positive".to_string()
        ));
    }

    Ok(number)
}

fn main() {
    match read_and_parse_number("number.txt") {
        Ok(num) => println!("Number: {}", num),
        Err(CustomError::IoError(e)) => eprintln!("IO Error: {}", e),
        Err(CustomError::ParseError(e)) => eprintln!("Parse Error: {}", e),
        Err(CustomError::InvalidData(msg)) => eprintln!("Invalid: {}", msg),
    }
}
```

### Advanced Combinator Chains

```rust
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err("Division by zero".to_string())
    } else {
        Ok(a / b)
    }
}

fn sqrt(n: f64) -> Result<f64, String> {
    if n < 0.0 {
        Err("Cannot take sqrt of negative number".to_string())
    } else {
        Ok(n.sqrt())
    }
}

fn main() {
    // Chaining operations with and_then
    let calculation = divide(16.0, 2.0)
        .and_then(|result| sqrt(result))
        .map(|result| result * 2.0)
        .map_err(|e| format!("Calculation failed: {}", e));

    match calculation {
        Ok(value) => println!("Result: {}", value),
        Err(e) => println!("{}", e),
    }

    // Collecting Results
    let numbers = vec![1, 2, 3, 4, 5];
    let results: Result<Vec<f64>, String> = numbers
        .iter()
        .map(|&n| divide(10.0, n as f64))
        .collect();

    match results {
        Ok(values) => println!("All divisions: {:?}", values),
        Err(e) => println!("Some division failed: {}", e),
    }
}
```

### Practical Real-world Example

```rust
use std::collections::HashMap;
use std::fs;
use std::io;

struct Config {
    database_url: String,
    port: u16,
    debug: bool,
}

fn parse_port(port_str: &str) -> Result<u16, String> {
    port_str
        .parse::<u16>()
        .map_err(|_| format!("Invalid port: {}", port_str))
}

fn load_config(filename: &str) -> Result<Config, Box<dyn std::error::Error>> {
    let content = fs::read_to_string(filename)?;

    let mut config = HashMap::new();
    for line in content.lines() {
        let mut parts = line.split('=');
        let key = parts.next().ok_or("Invalid line format")?;
        let value = parts.next().ok_or("Invalid line format")?;
        config.insert(key.trim(), value.trim());
    }

    let database_url = config
        .get("DATABASE_URL")
        .ok_or("DATABASE_URL not found")?
        .to_string();

    let port = config
        .get("PORT")
        .ok_or("PORT not found")
        .and_then(|&p| parse_port(p))?;

    let debug = config
        .get("DEBUG")
        .map(|&d| d == "true")
        .unwrap_or(false);

    Ok(Config {
        database_url,
        port,
        debug,
    })
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = load_config("config.txt")?;
    println!("Loaded config: {:?}", config);
    Ok(())
}
```

## Best Practices

### Prefer `?` Over `unwrap()` in Functions

Use the question mark operator for error propagation in fallible functions:

```rust
// Good: Error propagates naturally
fn process() -> Result<String, Box<dyn std::error::Error>> {
    let file = std::fs::read_to_string("file.txt")?;
    let cleaned = file.trim().to_string();
    Ok(cleaned)
}

// Poor: Panics on any error
fn process_bad() -> String {
    let file = std::fs::read_to_string("file.txt").unwrap();
    file.trim().to_string()
}
```

### Use Custom Error Types

Create specific error types for your domain:

```rust
use std::fmt;

#[derive(Debug)]
enum ApiError {
    BadRequest(String),
    NotFound,
    ServerError(String),
    NetworkError(String),
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ApiError::BadRequest(msg) => write!(f, "Bad request: {}", msg),
            ApiError::NotFound => write!(f, "Resource not found"),
            ApiError::ServerError(msg) => write!(f, "Server error: {}", msg),
            ApiError::NetworkError(msg) => write!(f, "Network error: {}", msg),
        }
    }
}

impl std::error::Error for ApiError {}
```

### Use Combinators Over Nested Matching

Prefer method chains:

```rust
// Good: Clear, concise
let result = option_value
    .map(|v| v * 2)
    .filter(|v| v > &10)
    .unwrap_or_default();

// Less readable: Nested matching
let result = match option_value {
    Some(v) => {
        let doubled = v * 2;
        if doubled > 10 {
            doubled
        } else {
            Default::default()
        }
    }
    None => Default::default(),
};
```

### Implement `From` for Error Conversion

Simplify error handling with automatic conversions:

```rust
use std::num::ParseIntError;

impl From<ParseIntError> for MyError {
    fn from(err: ParseIntError) -> Self {
        MyError::ParseFailed(err.to_string())
    }
}

// Now ? operator automatically converts
fn parse_config() -> Result<i32, MyError> {
    let number = "42".parse::<i32>()?;  // Automatically converts ParseIntError
    Ok(number)
}
```

### Document Error Cases

Be explicit about what errors a function can return:

```rust
/// Reads and parses a JSON configuration file.
///
/// # Errors
///
/// Returns an error if:
/// - The file cannot be read (IO errors)
/// - The file contains invalid JSON
/// - Required fields are missing
fn load_json_config(path: &str) -> Result<Config, ConfigError> {
    // Implementation
}
```

### Use `ok()` and `err()` for Selective Extraction

Convert between Option and Result:

```rust
let result: Result<i32, String> = Ok(42);

// Extract only success
let option_success = result.ok();  // Some(42)

// Extract only error
let option_error = result.err();  // None

// Convert back
let result_again = option_success.ok_or("Missing value");
```

## Common Pitfalls

### Over-using `unwrap()`

**Problem**: Panicking in production code with unwrap() on untrusted input.

```rust
// Dangerous: Input from user/file/network should never unwrap
let user_input = get_user_input();
let number = user_input.parse::<i32>().unwrap();  // ❌ Can panic
```

**Solution**: Use proper error handling:

```rust
let number = user_input.parse::<i32>()?;  // ✓ Propagates error
// or
let number = user_input.parse::<i32>().unwrap_or(0);  // ✓ Provides default
```

### Ignoring `Result` Values

**Problem**: Calling a fallible function but ignoring the Result.

```rust
std::fs::write("file.txt", "content");  // ❌ Compiler warning: unused Result

// Solution: explicitly ignore if intentional
let _ = std::fs::write("file.txt", "content");  // ✓ or handle the error
```

### Mixing `Option` and `Result` Incorrectly

**Problem**: Treating absence of value as an error.

```rust
fn find_user(id: u32) -> Result<User, String> {
    // ❌ Wrong: missing user is not an error, it's absence
    match DATABASE.find(id) {
        Some(user) => Ok(user),
        None => Err("User not found".to_string()),  // Should be Option
    }
}

// Better
fn find_user(id: u32) -> Option<User> {
    DATABASE.find(id)
}
```

### Losing Error Context

**Problem**: Returning generic error types that lose information.

```rust
fn read_config() -> Result<Config, String> {
    let content = std::fs::read_to_string("config.txt")
        .map_err(|e| "Failed to read".to_string())?;  // ❌ Lost details
    // ...
}

// Better: preserve context
fn read_config() -> Result<Config, Box<dyn std::error::Error>> {
    let content = std::fs::read_to_string("config.txt")?;  // ✓ Keeps error details
    // ...
}
```

### Panicking in Library Code

**Problem**: Libraries panicking on errors makes them unsuitable for production.

```rust
// Library code - Bad
pub fn parse_config(s: &str) -> Config {
    serde_json::from_str(s).unwrap()  // ❌ Panics on invalid JSON
}

// Library code - Good
pub fn parse_config(s: &str) -> Result<Config, Box<dyn std::error::Error>> {
    Ok(serde_json::from_str(s)?)  // ✓ Propagates error
}
```

### Over-nesting `map()` and `and_then()`

**Problem**: Deep chains become hard to read.

```rust
// Hard to read
let result = option1
    .and_then(|a| option2.map(|b| (a, b)))
    .and_then(|(a, b)| option3.map(|c| (a, b, c)))
    .and_then(|(a, b, c)| option4.map(|d| (a, b, c, d)));

// Better: Use if let with explicit structure
if let (Some(a), Some(b), Some(c), Some(d)) = (option1, option2, option3, option4) {
    // Use a, b, c, d
}

// Or use the ? operator
fn get_tuple() -> Option<(A, B, C, D)> {
    Some((option1?, option2?, option3?, option4?))
}
```

## Performance Considerations

### Zero-Cost Abstractions

`Option<T>` and `Result<T, E>` compile to efficient machine code with no runtime overhead:

```rust
// These compile to identical machine code
let maybe = Some(42);
let value = maybe.unwrap_or(0);

// versus
let value: i32;
if maybe.is_some() {
    value = maybe.unwrap();
} else {
    value = 0;
}
```

### Stack vs Heap Allocation

Keep Option/Result types on stack when possible:

```rust
// Efficient: Size is just value + discriminant
fn small_result() -> Result<i32, u32> { }

// Less efficient: Heap allocation
fn large_result() -> Result<LargeStruct, Error> {
    // Consider wrapping in Box if LargeStruct is truly large
}

// Better
fn large_result() -> Result<Box<LargeStruct>, Error> { }
```

### Error Type Size

Smaller error types are more efficient:

```rust
// Efficient: Enum is small
#[derive(Debug)]
enum SmallError {
    NotFound,
    Invalid,
    Timeout,
}

// Less efficient: Heap allocation per error
fn inefficient() -> Result<T, String> { }

// Better: Use &'static str when possible
fn efficient() -> Result<T, &'static str> { }
```

### Avoiding Unnecessary Clones

Use references in error types:

```rust
// Creates owned String (allocation)
fn process() -> Result<T, String> {
    Err(format!("Failed to process"))
}

// No allocation if message is static
fn process() -> Result<T, &'static str> {
    Err("Failed to process")
}

// Or use owned only when needed
fn process() -> Result<T, Box<dyn std::error::Error>> {
    // Only allocate when necessary
}
```

### Early Returns with `?` Operator

The `?` operator is optimized and creates early returns:

```rust
// Efficient: ? operator compiles to early return
fn process() -> Result<T, E> {
    operation1()?;
    operation2()?;
    operation3()?;
    Ok(result)
}

// Less efficient: unnecessary indirection
fn process() -> Result<T, E> {
    match operation1() {
        Ok(_) => {
            match operation2() {
                Ok(_) => {
                    match operation3() {
                        Ok(result) => Ok(result),
                        Err(e) => Err(e),
                    }
                }
                Err(e) => Err(e),
            }
        }
        Err(e) => Err(e),
    }
}
```

## Real-world Scenarios

### HTTP Request Handler

```rust
use std::collections::HashMap;

#[derive(Debug)]
enum HttpError {
    BadRequest(String),
    NotFound,
    InternalError,
}

struct Request {
    method: String,
    path: String,
    body: Option<String>,
}

fn validate_request(req: &Request) -> Result<(), HttpError> {
    if req.method.is_empty() {
        return Err(HttpError::BadRequest("Missing method".to_string()));
    }
    if req.path.is_empty() {
        return Err(HttpError::BadRequest("Missing path".to_string()));
    }
    Ok(())
}

fn route_request(req: Request) -> Result<String, HttpError> {
    validate_request(&req)?;

    match req.path.as_str() {
        "/users" => handle_users(&req),
        "/posts" => handle_posts(&req),
        _ => Err(HttpError::NotFound),
    }
}

fn handle_users(req: &Request) -> Result<String, HttpError> {
    // Extract and validate body
    let body = req.body.as_ref().ok_or(HttpError::BadRequest("Empty body".to_string()))?;

    // Process user data
    let user_id: u32 = body
        .split(':')
        .next()
        .ok_or(HttpError::BadRequest("Invalid format".to_string()))?
        .parse()
        .map_err(|_| HttpError::BadRequest("User ID must be number".to_string()))?;

    Ok(format!("Processing user {}", user_id))
}

fn handle_posts(req: &Request) -> Result<String, HttpError> {
    Ok("Posts handler".to_string())
}
```

### Database Transaction

```rust
struct Database;
struct User { id: u32, name: String }

#[derive(Debug)]
enum DbError {
    ConnectionFailed,
    QueryFailed(String),
    ValidationFailed(String),
}

impl Database {
    fn find_user(&self, id: u32) -> Result<Option<User>, DbError> {
        // Returns Option inside Result for "not found" vs "error"
        Ok(Some(User { id, name: "Alice".to_string() }))
    }

    fn update_user(&self, user: &User) -> Result<(), DbError> {
        if user.name.is_empty() {
            return Err(DbError::ValidationFailed("Name cannot be empty".to_string()));
        }
        Ok(())
    }
}

fn process_user(db: &Database, id: u32) -> Result<String, DbError> {
    // Find or return error
    let mut user = db
        .find_user(id)?
        .ok_or(DbError::QueryFailed("User not found".to_string()))?;

    // Modify and validate
    user.name = user.name.to_uppercase();
    db.update_user(&user)?;

    Ok(format!("Updated user: {}", user.name))
}
```

### Configuration Loading with Validation

```rust
use std::fs;
use std::str::FromStr;

#[derive(Debug)]
struct AppConfig {
    host: String,
    port: u16,
    workers: usize,
    timeout_secs: u64,
}

#[derive(Debug)]
enum ConfigError {
    IoError(String),
    ParseError(String),
    ValidationError(String),
}

impl AppConfig {
    fn from_file(path: &str) -> Result<Self, ConfigError> {
        let content = fs::read_to_string(path)
            .map_err(|e| ConfigError::IoError(e.to_string()))?;

        let config = content
            .lines()
            .filter(|line| !line.is_empty() && !line.starts_with('#'))
            .try_fold(
                std::collections::HashMap::new(),
                |mut map, line| {
                    let (key, value) = line
                        .split_once('=')
                        .ok_or(ConfigError::ParseError("Invalid format".to_string()))?;
                    map.insert(key.trim(), value.trim());
                    Ok::<_, ConfigError>(map)
                }
            )?;

        let host = config.get("host")
            .ok_or(ConfigError::ValidationError("Missing host".to_string()))?
            .to_string();

        let port = config.get("port")
            .ok_or(ConfigError::ValidationError("Missing port".to_string()))?
            .parse::<u16>()
            .map_err(|_| ConfigError::ParseError("Invalid port".to_string()))?;

        if port == 0 {
            return Err(ConfigError::ValidationError("Port cannot be 0".to_string()));
        }

        let workers = config.get("workers")
            .map(|w| w.parse::<usize>())
            .transpose()
            .map_err(|_| ConfigError::ParseError("Invalid workers".to_string()))?
            .unwrap_or_else(|| num_cpus::get());

        let timeout_secs = config.get("timeout")
            .map(|t| t.parse::<u64>())
            .transpose()
            .map_err(|_| ConfigError::ParseError("Invalid timeout".to_string()))?
            .unwrap_or(30);

        Ok(AppConfig {
            host,
            port,
            workers,
            timeout_secs,
        })
    }
}
```

## Interview Points

### "Explain the difference between Option and Result."

**Answer**:
- `Option<T>` represents **possible absence** - Some(T) or None. Use when a value may or may not exist.
- `Result<T, E>` represents **possible failure** - Ok(T) or Err(E). Use when an operation can fail with a specific error reason.
- `Option` doesn't carry error information; `Result` does.

Example:
```rust
fn find_item(id: u32) -> Option<Item> { }  // Item may not exist
fn parse_json(s: &str) -> Result<Json, ParseError> { }  // May fail with error info
```

### "What is the `?` operator and how does it work?"

**Answer**: The `?` operator is syntactic sugar for error propagation. It returns early with the error if an operation fails, otherwise extracts the success value. It only works in functions returning `Result` or `Option` (or types implementing `Try`).

```rust
fn foo() -> Result<i32, E> {
    let x = operation()?;  // Returns Err immediately if operation fails
    Ok(x)  // Uses x if operation succeeded
}

// Expands to:
fn foo() -> Result<i32, E> {
    let x = match operation() {
        Ok(val) => val,
        Err(e) => return Err(e),
    };
    Ok(x)
}
```

### "When should you use unwrap() vs ? operator?"

**Answer**:
- Use `?` operator in functions that return `Result`/`Option` - allows errors to propagate
- Use `unwrap()` only when you're absolutely certain the value exists - but never in library code or with untrusted input
- Use `unwrap_or()` or `unwrap_or_else()` to provide sensible defaults
- Use `expect()` for panics with helpful context

```rust
// Correct: Propagates error
fn load_file() -> Result<String, Box<dyn std::error::Error>> {
    std::fs::read_to_string("file.txt")?
}

// Reasonable: Panic is acceptable here
fn main() {
    let user_input = std::env::var("USERNAME").expect("USERNAME env var required");
}

// Poor: Panics on untrusted input
fn parse_user_input(input: &str) -> u32 {
    input.parse().unwrap()  // Panics on invalid input
}
```

### "How do you create custom error types?"

**Answer**: Implement the `Error` trait:

```rust
use std::fmt;
use std::error::Error;

#[derive(Debug)]
enum MyError {
    IoError(String),
    ParseError(String),
}

impl fmt::Display for MyError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            MyError::IoError(msg) => write!(f, "IO: {}", msg),
            MyError::ParseError(msg) => write!(f, "Parse: {}", msg),
        }
    }
}

impl Error for MyError {}

// Implement From for ? operator to work
impl From<std::io::Error> for MyError {
    fn from(err: std::io::Error) -> Self {
        MyError::IoError(err.to_string())
    }
}
```

### "What are combinators and when should you use them?"

**Answer**: Combinators are methods like `map()`, `and_then()`, `filter()` that transform values without explicit branching. Use them for clean, functional error handling:

```rust
// With combinators
let result = option
    .map(|x| x * 2)
    .filter(|x| x > &10)
    .unwrap_or(0);

// vs explicit match
let result = match option {
    Some(x) => {
        let doubled = x * 2;
        if doubled > 10 {
            doubled
        } else {
            0
        }
    }
    None => 0,
};
```

### "How does `collect()` work with Results?"

**Answer**: `collect()` can convert `Iterator<Item=Result<T, E>>` to `Result<Vec<T>, E>` - it short-circuits on the first error:

```rust
let results = vec![Ok(1), Ok(2), Ok(3)];
let nums: Result<Vec<i32>, String> = results.into_iter().collect();
assert_eq!(nums, Ok(vec![1, 2, 3]));

let results = vec![Ok(1), Err("failed"), Ok(3)];
let nums: Result<Vec<i32>, &str> = results.into_iter().collect();
assert_eq!(nums, Err("failed"));
```

### "What's the difference between map() and and_then()?"

**Answer**:
- `map()` applies a function that returns a regular value: `Option<T>.map(fn(T) -> U) -> Option<U>`
- `and_then()` applies a function that returns an Option/Result: `Option<T>.and_then(fn(T) -> Option<U>) -> Option<U>`

```rust
let x = Some(2);

// map: regular function
let y = x.map(|n| n * 2);  // Some(4)

// and_then: returns Option
let y = x.and_then(|n| if n > 1 { Some(n * 2) } else { None });  // Some(4)
```

## Further Reading

### Official Resources
- [Rust Book - Result Type](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html)
- [Rust Book - Option Type](https://doc.rust-lang.org/book/ch06-01-enums.html#the-option-enum)
- [Rust Standard Library: Option](https://doc.rust-lang.org/std/option/)
- [Rust Standard Library: Result](https://doc.rust-lang.org/std/result/)
- [Error Handling Guide](https://doc.rust-lang.org/rust-by-example/error.html)

### Advanced Topics
- [thiserror crate](https://docs.rs/thiserror/latest/thiserror/) - Ergonomic error handling
- [anyhow crate](https://docs.rs/anyhow/latest/anyhow/) - Flexible error handling
- [Error Handling in Rust](https://www.youtube.com/watch?v=j-VQCYP7wSkk) - Video by Jon Gjengset
- [Common Rust Antipatterns](https://rust-lang.github.io/api-guidelines/)

### Related Topics
- Rust's ownership and borrowing system
- Generic types and trait bounds
- Pattern matching and if let
- Panics vs Recoverable Errors
- Custom error types and the Error trait
- Result<T, Box<dyn Error>>
- Error propagation strategies
