---
title: Rust Error Handling
description: "Deep dive into Rust error handling: Result, Option, ? operator and custom errors"
track: rust
section: error-handling
difficulty: intermediate
tags:
  - Rust
  - Error Handling
  - Result
  - Option
status: imported
origin: old/src/content/docs/rust/error-handling.en.md
divergence: 0.269
issues: []
legacy:
  category: Rust
  subcategory: Error Handling
  order: 3
  lastUpdated: 2026-01-07
---

Error handling is one of Rust's most distinctive features, designed to make errors explicit and recoverable while maintaining performance. Unlike many languages that rely on exceptions, Rust uses the type system to represent errors as values, forcing developers to handle them explicitly.

## The Philosophy of Rust Error Handling

Rust distinguishes between two types of errors:

- **Recoverable errors**: Errors that can be handled and recovered from (e.g., file not found)
- **Unrecoverable errors**: Fatal errors that should terminate the program (e.g., accessing an invalid array index)

For recoverable errors, Rust uses `Result<T, E>` and `Option<T>`. For unrecoverable errors, Rust uses the `panic!` macro.

```rust
// Recoverable: return a Result
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err(String::from("Division by zero"))
    } else {
        Ok(a / b)
    }
}

// Unrecoverable: panic
fn access_array(arr: &[i32], index: usize) -> i32 {
    if index >= arr.len() {
        panic!("Index out of bounds: {} >= {}", index, arr.len());
    }
    arr[index]
}
```

## The Result Type

`Result<T, E>` is an enum that represents either success (`Ok(T)`) or failure (`Err(E)`):

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

### Basic Usage

```rust
use std::fs::File;
use std::io::Read;

fn read_file(path: &str) -> Result<String, std::io::Error> {
    let mut file = File::open(path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

fn main() {
    match read_file("config.txt") {
        Ok(contents) => println!("File contents: {}", contents),
        Err(e) => eprintln!("Error reading file: {}", e),
    }
}
```

### Pattern Matching with Result

```rust
fn parse_number(s: &str) -> Result<i32, std::num::ParseIntError> {
    s.parse::<i32>()
}

fn main() {
    let result = parse_number("42");

    match result {
        Ok(num) => println!("Parsed number: {}", num),
        Err(e) => println!("Failed to parse: {}", e),
    }
}
```

### Unwrapping Results

```rust
// unwrap(): panics if Result is Err
let value = some_result.unwrap();

// expect(): panics with custom message
let value = some_result.expect("Failed to get value");

// unwrap_or(): provides default value
let value = some_result.unwrap_or(42);

// unwrap_or_else(): provides default via closure
let value = some_result.unwrap_or_else(|_| {
    println!("Using default value");
    42
});
```

## The Option Type

`Option<T>` represents a value that might be absent:

```rust
enum Option<T> {
    Some(T),
    None,
}
```

### Basic Usage

```rust
fn find_user(id: u32) -> Option<String> {
    if id == 1 {
        Some(String::from("Alice"))
    } else {
        None
    }
}

fn main() {
    match find_user(1) {
        Some(name) => println!("Found user: {}", name),
        None => println!("User not found"),
    }
}
```

### Working with Option

```rust
fn divide(numerator: f64, denominator: f64) -> Option<f64> {
    if denominator == 0.0 {
        None
    } else {
        Some(numerator / denominator)
    }
}

fn main() {
    let result = divide(10.0, 2.0);

    // Pattern matching
    match result {
        Some(x) => println!("Result: {}", x),
        None => println!("Cannot divide by zero"),
    }

    // Using if let
    if let Some(x) = result {
        println!("Result: {}", x);
    }

    // Unwrapping with default
    let value = result.unwrap_or(0.0);
    println!("Value: {}", value);
}
```

### Converting Between Option and Result

```rust
fn main() {
    let opt: Option<i32> = Some(42);

    // Option to Result
    let res: Result<i32, &str> = opt.ok_or("Value is None");

    let res: Result<i32, String> = opt.ok_or_else(|| {
        String::from("Computed error message")
    });

    // Result to Option
    let result: Result<i32, &str> = Ok(42);
    let option: Option<i32> = result.ok();
}
```

## Combinator Methods

Combinators allow you to chain operations on `Result` and `Option` without explicit pattern matching.

### map and map_err

```rust
fn main() {
    let result: Result<i32, &str> = Ok(10);

    // Transform the success value
    let doubled = result.map(|x| x * 2);
    println!("{:?}", doubled); // Ok(20)

    let error: Result<i32, &str> = Err("error");

    // Transform the error value
    let mapped_error = error.map_err(|e| format!("Error: {}", e));
    println!("{:?}", mapped_error); // Err("Error: error")
}
```

### and_then (flatMap)

```rust
fn parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError> {
    s.parse::<i32>().and_then(|n| Ok(n * 2))
}

fn divide_safe(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err(String::from("Division by zero"))
    } else {
        Ok(a / b)
    }
}

fn parse_and_divide(a: &str, b: &str) -> Result<i32, String> {
    a.parse::<i32>()
        .map_err(|e| format!("Failed to parse a: {}", e))
        .and_then(|num_a| {
            b.parse::<i32>()
                .map_err(|e| format!("Failed to parse b: {}", e))
                .and_then(|num_b| divide_safe(num_a, num_b))
        })
}

fn main() {
    println!("{:?}", parse_and_double("21")); // Ok(42)
    println!("{:?}", parse_and_divide("10", "2")); // Ok(5)
}
```

### or and or_else

```rust
fn main() {
    let primary: Result<i32, &str> = Err("primary failed");
    let fallback: Result<i32, &str> = Ok(42);

    // Use fallback if primary fails
    let result = primary.or(fallback);
    println!("{:?}", result); // Ok(42)

    // Computed fallback
    let result = primary.or_else(|_| Ok(100));
    println!("{:?}", result); // Ok(100)
}
```

### Option Combinators

```rust
fn main() {
    let some_value = Some(5);

    // map
    let doubled = some_value.map(|x| x * 2);
    println!("{:?}", doubled); // Some(10)

    // and_then
    let result = some_value.and_then(|x| {
        if x > 0 {
            Some(x * 2)
        } else {
            None
        }
    });
    println!("{:?}", result); // Some(10)

    // filter
    let filtered = some_value.filter(|&x| x > 3);
    println!("{:?}", filtered); // Some(5)

    // or
    let none: Option<i32> = None;
    let result = none.or(Some(42));
    println!("{:?}", result); // Some(42)
}
```

## The Question Mark Operator

The `?` operator is syntactic sugar for propagating errors. It can only be used in functions that return `Result` or `Option`.

### Basic Usage

```rust
use std::fs::File;
use std::io::{self, Read};

// Without ? operator
fn read_file_verbose(path: &str) -> Result<String, io::Error> {
    let mut file = match File::open(path) {
        Ok(f) => f,
        Err(e) => return Err(e),
    };

    let mut contents = String::new();
    match file.read_to_string(&mut contents) {
        Ok(_) => Ok(contents),
        Err(e) => Err(e),
    }
}

// With ? operator
fn read_file_concise(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

// Even more concise
fn read_file_shortest(path: &str) -> Result<String, io::Error> {
    let mut contents = String::new();
    File::open(path)?.read_to_string(&mut contents)?;
    Ok(contents)
}
```

### Using ? with Option

```rust
fn get_first_char(text: &str) -> Option<char> {
    text.lines().next()?.chars().next()
}

fn parse_config(config: Option<&str>) -> Option<i32> {
    let cfg = config?;
    cfg.trim().parse().ok()
}

fn main() {
    println!("{:?}", get_first_char("Hello")); // Some('H')
    println!("{:?}", get_first_char("")); // None

    println!("{:?}", parse_config(Some("42"))); // Some(42)
    println!("{:?}", parse_config(None)); // None
}
```

### Error Conversion with ?

The `?` operator automatically converts errors using the `From` trait:

```rust
use std::fs::File;
use std::io::{self, Read};
use std::num::ParseIntError;

#[derive(Debug)]
enum MyError {
    Io(io::Error),
    Parse(ParseIntError),
}

impl From<io::Error> for MyError {
    fn from(err: io::Error) -> MyError {
        MyError::Io(err)
    }
}

impl From<ParseIntError> for MyError {
    fn from(err: ParseIntError) -> MyError {
        MyError::Parse(err)
    }
}

fn read_and_parse(path: &str) -> Result<i32, MyError> {
    let mut file = File::open(path)?; // io::Error -> MyError
    let mut contents = String::new();
    file.read_to_string(&mut contents)?; // io::Error -> MyError
    let number = contents.trim().parse()?; // ParseIntError -> MyError
    Ok(number)
}
```

## Custom Error Types

Creating custom error types helps make your error handling more expressive and type-safe.

### Simple Custom Error

```rust
use std::fmt;

#[derive(Debug)]
pub enum ConfigError {
    FileNotFound(String),
    ParseError(String),
    ValidationError(String),
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ConfigError::FileNotFound(path) => {
                write!(f, "Configuration file not found: {}", path)
            }
            ConfigError::ParseError(msg) => {
                write!(f, "Failed to parse configuration: {}", msg)
            }
            ConfigError::ValidationError(msg) => {
                write!(f, "Configuration validation failed: {}", msg)
            }
        }
    }
}

impl std::error::Error for ConfigError {}

fn load_config(path: &str) -> Result<String, ConfigError> {
    if path.is_empty() {
        return Err(ConfigError::FileNotFound(String::from("(empty path)")));
    }

    // Simulate loading and parsing
    Ok(String::from("config data"))
}
```

### Wrapping Multiple Error Types

```rust
use std::io;
use std::num::ParseIntError;
use std::fmt;

#[derive(Debug)]
pub enum AppError {
    Io(io::Error),
    Parse(ParseIntError),
    Custom(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::Io(err) => write!(f, "IO error: {}", err),
            AppError::Parse(err) => write!(f, "Parse error: {}", err),
            AppError::Custom(msg) => write!(f, "Application error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            AppError::Io(err) => Some(err),
            AppError::Parse(err) => Some(err),
            AppError::Custom(_) => None,
        }
    }
}

impl From<io::Error> for AppError {
    fn from(err: io::Error) -> AppError {
        AppError::Io(err)
    }
}

impl From<ParseIntError> for AppError {
    fn from(err: ParseIntError) -> AppError {
        AppError::Parse(err)
    }
}
```

## Error Handling Libraries

### thiserror

`thiserror` provides a convenient derive macro for implementing the `Error` trait:

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DataStoreError {
    #[error("Data not found: {0}")]
    NotFound(String),

    #[error("Invalid data format in {path}: {reason}")]
    InvalidFormat {
        path: String,
        reason: String,
    },

    #[error("Connection failed")]
    ConnectionFailed(#[from] std::io::Error),

    #[error("Parse error")]
    ParseError(#[from] std::num::ParseIntError),

    #[error("Unknown error")]
    Unknown,
}

fn fetch_data(id: &str) -> Result<String, DataStoreError> {
    if id.is_empty() {
        return Err(DataStoreError::NotFound(String::from("empty ID")));
    }
    Ok(String::from("data"))
}

fn process_file(path: &str) -> Result<(), DataStoreError> {
    if path.is_empty() {
        return Err(DataStoreError::InvalidFormat {
            path: path.to_string(),
            reason: String::from("path is empty"),
        });
    }
    Ok(())
}
```

### anyhow

`anyhow` provides a simple way to handle errors in applications where you don't need custom error types:

```rust
use anyhow::{Context, Result, anyhow};

fn read_config(path: &str) -> Result<String> {
    std::fs::read_to_string(path)
        .context(format!("Failed to read config file: {}", path))
}

fn parse_port(s: &str) -> Result<u16> {
    s.parse::<u16>()
        .context("Failed to parse port number")
}

fn initialize_app() -> Result<()> {
    let config = read_config("config.toml")?;

    if config.is_empty() {
        return Err(anyhow!("Configuration is empty"));
    }

    let port = parse_port("8080")?;
    println!("Starting server on port {}", port);

    Ok(())
}

fn main() {
    if let Err(e) = initialize_app() {
        eprintln!("Error: {}", e);

        // Print the error chain
        for cause in e.chain().skip(1) {
            eprintln!("Caused by: {}", cause);
        }

        std::process::exit(1);
    }
}
```

### Choosing Between thiserror and anyhow

- **Use `thiserror`** for libraries where you want to provide specific error types for users
- **Use `anyhow`** for applications where you primarily care about error messages and context

```rust
// Library code - use thiserror
use thiserror::Error;

#[derive(Error, Debug)]
pub enum LibraryError {
    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Operation failed")]
    OperationFailed(#[from] std::io::Error),
}

pub fn library_function(input: &str) -> Result<String, LibraryError> {
    if input.is_empty() {
        return Err(LibraryError::InvalidInput(String::from("empty string")));
    }
    Ok(input.to_uppercase())
}

// Application code - use anyhow
use anyhow::{Context, Result};

fn application_code() -> Result<()> {
    let result = library_function("hello")
        .context("Failed to process input")?;

    println!("Result: {}", result);
    Ok(())
}
```

## Best Practices

### Don't Overuse unwrap() and expect()

```rust
// Bad: can panic in production
fn bad_example(data: &str) -> i32 {
    data.parse::<i32>().unwrap()
}

// Good: handle the error
fn good_example(data: &str) -> Result<i32, std::num::ParseIntError> {
    data.parse::<i32>()
}

// OK in tests
#[cfg(test)]
mod tests {
    #[test]
    fn test_parsing() {
        let result = "42".parse::<i32>().unwrap();
        assert_eq!(result, 42);
    }
}
```

### Provide Context for Errors

```rust
use anyhow::{Context, Result};

fn load_user_data(user_id: u32) -> Result<String> {
    let path = format!("users/{}.json", user_id);

    std::fs::read_to_string(&path)
        .context(format!("Failed to load user data for user {}", user_id))
}
```

### Use Type Aliases for Complex Result Types

```rust
use std::io;

// Define a type alias
type Result<T> = std::result::Result<T, io::Error>;

fn read_data(path: &str) -> Result<String> {
    std::fs::read_to_string(path)
}

fn write_data(path: &str, data: &str) -> Result<()> {
    std::fs::write(path, data)
}
```

### Layer Your Error Types

```rust
use thiserror::Error;

// Low-level errors
#[derive(Error, Debug)]
pub enum DatabaseError {
    #[error("Connection failed")]
    ConnectionFailed,

    #[error("Query failed: {0}")]
    QueryFailed(String),
}

// High-level errors
#[derive(Error, Debug)]
pub enum ServiceError {
    #[error("User not found")]
    UserNotFound,

    #[error("Database error")]
    Database(#[from] DatabaseError),

    #[error("Validation error: {0}")]
    Validation(String),
}

fn get_user(id: u32) -> Result<String, ServiceError> {
    if id == 0 {
        return Err(ServiceError::Validation(
            String::from("User ID cannot be zero")
        ));
    }

    // Simulate database call
    Err(DatabaseError::ConnectionFailed)?
}
```

### Early Returns with ?

```rust
fn validate_and_process(input: &str) -> Result<i32, String> {
    // Early validation
    if input.is_empty() {
        return Err(String::from("Input cannot be empty"));
    }

    if input.len() > 100 {
        return Err(String::from("Input too long"));
    }

    // Process
    let number = input.parse::<i32>()
        .map_err(|e| format!("Parse error: {}", e))?;

    if number < 0 {
        return Err(String::from("Number must be positive"));
    }

    Ok(number * 2)
}
```

### Error Recovery Patterns

```rust
use std::time::Duration;

fn fetch_with_retry(url: &str, max_retries: u32) -> Result<String, String> {
    let mut attempts = 0;

    loop {
        match fetch_data(url) {
            Ok(data) => return Ok(data),
            Err(e) => {
                attempts += 1;
                if attempts >= max_retries {
                    return Err(format!(
                        "Failed after {} attempts: {}",
                        max_retries,
                        e
                    ));
                }
                std::thread::sleep(Duration::from_secs(1));
            }
        }
    }
}

fn fetch_data(url: &str) -> Result<String, String> {
    // Simulate fetching
    if url.is_empty() {
        Err(String::from("Invalid URL"))
    } else {
        Ok(String::from("data"))
    }
}
```

## Summary

Rust's error handling system forces you to handle errors explicitly, leading to more robust code:

- **`Result<T, E>`**: For operations that can fail with recoverable errors
- **`Option<T>`**: For values that might be absent
- **Combinator methods**: Chain operations without explicit pattern matching
- **`?` operator**: Propagate errors ergonomically
- **Custom error types**: Create expressive, domain-specific errors
- **`thiserror`**: Simplify error type creation in libraries
- **`anyhow`**: Flexible error handling in applications

By leveraging these tools and following best practices, you can write Rust code that handles errors gracefully while maintaining performance and safety.
