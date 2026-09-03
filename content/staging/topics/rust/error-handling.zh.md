---
title: Rust 错误处理
description: 深入理解 Rust 错误处理：Result、Option、? 运算符与自定义错误
track: rust
section: error-handling
difficulty: intermediate
tags:
  - Rust
  - 错误处理
  - Result
  - Option
status: imported
origin: old/src/content/docs/rust/error-handling.zh.md
divergence: 0.269
issues: []
legacy:
  category: Rust
  subcategory: 错误处理
  order: 3
  lastUpdated: 2026-01-07
---

Rust 采用了一套独特而强大的错误处理机制,通过类型系统在编译时强制开发者处理可能出现的错误。与传统的异常机制不同,Rust 使用 `Result` 和 `Option` 类型来显式表达可能失败的操作。

## Result 与 Option

### Option 类型

`Option<T>` 用于表示一个值可能存在或不存在的情况:

```rust
enum Option<T> {
    Some(T),
    None,
}
```

**基本用法:**

```rust
fn find_user(id: u32) -> Option<String> {
    if id == 1 {
        Some(String::from("Alice"))
    } else {
        None
    }
}

fn main() {
    // 使用 match 处理 Option
    match find_user(1) {
        Some(name) => println!("找到用户: {}", name),
        None => println!("用户不存在"),
    }

    // 使用 if let
    if let Some(name) = find_user(1) {
        println!("用户名: {}", name);
    }

    // 使用 unwrap_or 提供默认值
    let name = find_user(2).unwrap_or(String::from("Guest"));
    println!("用户名: {}", name);
}
```

### Result 类型

`Result<T, E>` 用于表示可能成功或失败的操作:

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

**基本用法:**

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?;
    let mut username = String::new();
    file.read_to_string(&mut username)?;
    Ok(username)
}

fn main() {
    match read_username_from_file("user.txt") {
        Ok(username) => println!("用户名: {}", username),
        Err(e) => println!("读取失败: {}", e),
    }
}
```

## 组合子方法

Rust 为 `Option` 和 `Result` 提供了丰富的组合子方法,让错误处理更加优雅。

### Option 组合子

```rust
fn main() {
    let some_number = Some(5);
    let no_number: Option<i32> = None;

    // map: 转换 Some 中的值
    let doubled = some_number.map(|x| x * 2);
    println!("{:?}", doubled); // Some(10)

    // and_then (flatMap): 链式操作
    let result = some_number
        .and_then(|x| if x > 0 { Some(x * 2) } else { None })
        .and_then(|x| Some(x + 1));
    println!("{:?}", result); // Some(11)

    // or: 提供备选值
    let value = no_number.or(Some(100));
    println!("{:?}", value); // Some(100)

    // filter: 过滤值
    let filtered = some_number.filter(|&x| x > 10);
    println!("{:?}", filtered); // None

    // unwrap_or_else: 懒加载默认值
    let default = no_number.unwrap_or_else(|| {
        println!("计算默认值");
        42
    });
    println!("{}", default);
}
```

### Result 组合子

```rust
use std::num::ParseIntError;

fn parse_and_double(s: &str) -> Result<i32, ParseIntError> {
    s.parse::<i32>().map(|n| n * 2)
}

fn parse_and_validate(s: &str) -> Result<i32, String> {
    s.parse::<i32>()
        .map_err(|e| format!("解析错误: {}", e))
        .and_then(|n| {
            if n > 0 {
                Ok(n)
            } else {
                Err("数字必须为正数".to_string())
            }
        })
}

fn main() {
    // map: 转换成功值
    let result = parse_and_double("21");
    println!("{:?}", result); // Ok(42)

    // map_err: 转换错误值
    let result = "abc".parse::<i32>()
        .map_err(|e| format!("自定义错误: {}", e));
    println!("{:?}", result);

    // and_then: 链式操作
    println!("{:?}", parse_and_validate("42")); // Ok(42)
    println!("{:?}", parse_and_validate("-5")); // Err("数字必须为正数")

    // or_else: 处理错误并提供备选方案
    let result = "abc".parse::<i32>()
        .or_else(|_| Ok(0));
    println!("{:?}", result); // Ok(0)
}
```

### 高级组合子

```rust
fn main() {
    // transpose: Option<Result<T, E>> <-> Result<Option<T>, E>
    let x: Option<Result<i32, &str>> = Some(Ok(5));
    let y: Result<Option<i32>, &str> = x.transpose();
    println!("{:?}", y); // Ok(Some(5))

    // flatten: 展平嵌套结构
    let nested = Some(Some(42));
    let flattened = nested.flatten();
    println!("{:?}", flattened); // Some(42)

    // zip: 组合两个 Option
    let a = Some(1);
    let b = Some(2);
    let zipped = a.zip(b);
    println!("{:?}", zipped); // Some((1, 2))
}
```

## ? 运算符

`?` 运算符是 Rust 错误处理的核心特性,用于简化错误传播。

### 基本用法

```rust
use std::fs::File;
use std::io::{self, Read};

// 不使用 ? 运算符
fn read_file_verbose(path: &str) -> Result<String, io::Error> {
    let file_result = File::open(path);
    let mut file = match file_result {
        Ok(f) => f,
        Err(e) => return Err(e),
    };

    let mut contents = String::new();
    match file.read_to_string(&mut contents) {
        Ok(_) => Ok(contents),
        Err(e) => Err(e),
    }
}

// 使用 ? 运算符
fn read_file_concise(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

// 更简洁的链式调用
fn read_file_chain(path: &str) -> Result<String, io::Error> {
    let mut contents = String::new();
    File::open(path)?.read_to_string(&mut contents)?;
    Ok(contents)
}
```

### ? 运算符的类型转换

`?` 运算符会自动调用 `From` trait 进行错误类型转换:

```rust
use std::fs::File;
use std::io::{self, Read};
use std::num::ParseIntError;

#[derive(Debug)]
enum MyError {
    Io(io::Error),
    Parse(ParseIntError),
}

// 实现 From trait 以支持自动转换
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
    let mut file = File::open(path)?; // io::Error 自动转换为 MyError
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    let number = contents.trim().parse::<i32>()?; // ParseIntError 自动转换
    Ok(number)
}
```

### Option 中的 ? 运算符

`?` 运算符也可以用于 `Option`:

```rust
fn get_first_char(s: &str) -> Option<char> {
    s.chars().next()
}

fn get_uppercase_first_char(s: &str) -> Option<char> {
    let first = get_first_char(s)?;
    Some(first.to_uppercase().next()?)
}

fn main() {
    println!("{:?}", get_uppercase_first_char("hello")); // Some('H')
    println!("{:?}", get_uppercase_first_char("")); // None
}
```

## 自定义错误类型

### 手动实现错误类型

```rust
use std::fmt;
use std::error::Error;
use std::io;
use std::num::ParseIntError;

#[derive(Debug)]
enum AppError {
    Io(io::Error),
    Parse(ParseIntError),
    NotFound(String),
    InvalidInput { field: String, reason: String },
}

// 实现 Display trait
impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::Io(err) => write!(f, "IO 错误: {}", err),
            AppError::Parse(err) => write!(f, "解析错误: {}", err),
            AppError::NotFound(item) => write!(f, "未找到: {}", item),
            AppError::InvalidInput { field, reason } => {
                write!(f, "字段 '{}' 输入无效: {}", field, reason)
            }
        }
    }
}

// 实现 Error trait
impl Error for AppError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            AppError::Io(err) => Some(err),
            AppError::Parse(err) => Some(err),
            _ => None,
        }
    }
}

// 实现 From trait 支持错误转换
impl From<io::Error> for AppError {
    fn from(err: io::Error) -> Self {
        AppError::Io(err)
    }
}

impl From<ParseIntError> for AppError {
    fn from(err: ParseIntError) -> Self {
        AppError::Parse(err)
    }
}

// 使用自定义错误
fn process_user_data(data: &str) -> Result<i32, AppError> {
    if data.is_empty() {
        return Err(AppError::InvalidInput {
            field: "data".to_string(),
            reason: "不能为空".to_string(),
        });
    }

    let number = data.parse::<i32>()?;

    if number < 0 {
        return Err(AppError::NotFound("正数".to_string()));
    }

    Ok(number)
}
```

## 使用 thiserror

`thiserror` 是一个流行的库,用于简化自定义错误类型的定义:

```rust
use thiserror::Error;
use std::io;
use std::num::ParseIntError;

#[derive(Error, Debug)]
enum DataError {
    #[error("IO 错误")]
    Io(#[from] io::Error),

    #[error("解析错误: {0}")]
    Parse(#[from] ParseIntError),

    #[error("数据未找到: {item}")]
    NotFound { item: String },

    #[error("字段 '{field}' 验证失败: {reason}")]
    Validation { field: String, reason: String },

    #[error("数据库错误 (代码: {code})")]
    Database { code: i32 },
}

fn validate_and_parse(input: &str) -> Result<i32, DataError> {
    if input.is_empty() {
        return Err(DataError::Validation {
            field: "input".to_string(),
            reason: "输入不能为空".to_string(),
        });
    }

    let number: i32 = input.parse()?;

    if number <= 0 {
        return Err(DataError::NotFound {
            item: "正整数".to_string(),
        });
    }

    Ok(number)
}

fn main() {
    match validate_and_parse("") {
        Ok(n) => println!("结果: {}", n),
        Err(e) => println!("错误: {}", e),
    }
}
```

## 使用 anyhow

`anyhow` 提供了一个通用的错误类型,适合应用程序(而非库)使用:

```rust
use anyhow::{Context, Result, anyhow, bail};
use std::fs::File;
use std::io::Read;

// Result<T> 是 Result<T, anyhow::Error> 的别名
fn read_config(path: &str) -> Result<String> {
    let mut file = File::open(path)
        .context(format!("无法打开配置文件: {}", path))?;

    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .context("读取配置文件失败")?;

    if contents.is_empty() {
        bail!("配置文件为空");
    }

    Ok(contents)
}

fn parse_port(config: &str) -> Result<u16> {
    let port = config
        .lines()
        .find(|line| line.starts_with("port="))
        .ok_or_else(|| anyhow!("配置中未找到 port 字段"))?
        .trim_start_matches("port=")
        .parse::<u16>()
        .context("端口号必须是 0-65535 之间的整数")?;

    if port < 1024 {
        bail!("端口号 {} 小于 1024,可能需要管理员权限", port);
    }

    Ok(port)
}

fn start_server() -> Result<()> {
    let config = read_config("server.conf")
        .context("初始化服务器配置失败")?;

    let port = parse_port(&config)
        .context("解析服务器端口失败")?;

    println!("服务器将在端口 {} 上启动", port);
    Ok(())
}

fn main() {
    if let Err(e) = start_server() {
        eprintln!("错误: {:?}", e);

        // 打印错误链
        eprintln!("\n错误链:");
        for (i, cause) in e.chain().enumerate() {
            eprintln!("  {}: {}", i, cause);
        }
    }
}
```

### anyhow 的高级用法

```rust
use anyhow::{Context, Result, ensure};
use std::collections::HashMap;

#[derive(Debug)]
struct User {
    id: u32,
    name: String,
    age: u8,
}

fn validate_user_data(data: &HashMap<String, String>) -> Result<User> {
    // ensure! 宏:条件为 false 时返回错误
    ensure!(data.contains_key("id"), "缺少必需字段: id");
    ensure!(data.contains_key("name"), "缺少必需字段: name");
    ensure!(data.contains_key("age"), "缺少必需字段: age");

    let id = data["id"].parse::<u32>()
        .context("id 必须是有效的数字")?;

    let name = data["name"].clone();
    ensure!(!name.is_empty(), "name 不能为空");
    ensure!(name.len() <= 50, "name 长度不能超过 50 个字符");

    let age = data["age"].parse::<u8>()
        .context("age 必须是 0-255 之间的数字")?;
    ensure!(age >= 18, "用户年龄必须大于等于 18 岁");

    Ok(User { id, name, age })
}

fn main() {
    let mut data = HashMap::new();
    data.insert("id".to_string(), "1001".to_string());
    data.insert("name".to_string(), "张三".to_string());
    data.insert("age".to_string(), "25".to_string());

    match validate_user_data(&data) {
        Ok(user) => println!("用户验证成功: {:?}", user),
        Err(e) => eprintln!("验证失败: {:#}", e),
    }
}
```

## 错误处理最佳实践

### 选择合适的错误类型

```rust
// 库代码:使用自定义错误类型(如 thiserror)
// pub fn library_function() -> Result<T, LibraryError> { ... }

// 应用代码:使用 anyhow
// fn application_logic() -> anyhow::Result<()> { ... }
```

### 提供有用的错误上下文

```rust
use anyhow::{Context, Result};
use std::fs;

fn process_file(path: &str) -> Result<()> {
    let content = fs::read_to_string(path)
        .with_context(|| format!("读取文件失败: {}", path))?;

    let lines: Vec<&str> = content.lines().collect();

    for (i, line) in lines.iter().enumerate() {
        process_line(line)
            .with_context(|| format!("处理第 {} 行时失败: {}", i + 1, line))?;
    }

    Ok(())
}

fn process_line(line: &str) -> Result<()> {
    // 处理逻辑
    Ok(())
}
```

### 避免过度使用 unwrap 和 expect

```rust
// 不好的做法
fn bad_example(path: &str) -> String {
    std::fs::read_to_string(path).unwrap() // 可能导致 panic
}

// 好的做法
fn good_example(path: &str) -> Result<String, std::io::Error> {
    std::fs::read_to_string(path)
}

// 在确定不会失败时使用 expect
fn acceptable_expect() {
    let numbers = vec![1, 2, 3];
    let first = numbers.first().expect("向量已知非空");
}
```

### 使用类型系统防止错误

```rust
// 使用 newtype 模式确保数据有效性
struct Email(String);

impl Email {
    fn new(s: String) -> Result<Self, String> {
        if s.contains('@') {
            Ok(Email(s))
        } else {
            Err("无效的邮箱地址".to_string())
        }
    }

    fn as_str(&self) -> &str {
        &self.0
    }
}

// 现在 Email 类型保证了数据有效性
fn send_email(to: &Email, subject: &str) {
    println!("发送邮件到 {}: {}", to.as_str(), subject);
}
```

### 错误恢复策略

```rust
use std::time::Duration;
use std::thread;

fn fetch_data_with_retry(url: &str, max_retries: u32) -> Result<String, String> {
    let mut attempts = 0;

    loop {
        match fetch_data(url) {
            Ok(data) => return Ok(data),
            Err(e) => {
                attempts += 1;
                if attempts >= max_retries {
                    return Err(format!("重试 {} 次后仍然失败: {}", max_retries, e));
                }

                println!("第 {} 次尝试失败,1秒后重试...", attempts);
                thread::sleep(Duration::from_secs(1));
            }
        }
    }
}

fn fetch_data(url: &str) -> Result<String, String> {
    // 模拟网络请求
    Err("连接超时".to_string())
}
```

## 总结

Rust 的错误处理机制通过以下方式确保程序的健壮性:

1. **显式错误处理**: `Result` 和 `Option` 类型强制开发者处理错误
2. **组合子方法**: 提供函数式编程风格的优雅错误处理
3. **? 运算符**: 简化错误传播,保持代码简洁
4. **自定义错误**: 支持定义领域特定的错误类型
5. **生态系统支持**: `thiserror` 和 `anyhow` 等库提供便捷工具

通过合理使用这些特性,可以编写出既安全又易于维护的 Rust 代码。记住:在 Rust 中,处理错误不是可选的,而是语言设计的核心部分。
