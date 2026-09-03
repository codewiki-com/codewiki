---
title: Rust Option 与 Result 类型完全指南
description: 深入理解 Rust 的 Option 和 Result 类型：空值处理、错误处理、组合子方法与 ? 运算符
track: rust
section: error-handling
difficulty: intermediate
tags:
  - Rust
  - Option
  - Result
  - 错误处理
  - 函数式编程
status: imported
origin: old/src/content/docs/rust/option-result.zh.md
divergence: 0.227
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Rust
  subcategory: 错误处理
  order: 4
  lastUpdated: 2026-01-07
---

Rust 采用了一种独特的方式来处理空值和错误：通过 `Option<T>` 和 `Result<T, E>` 类型在编译时强制开发者显式处理这些情况。这种设计消除了空指针异常和未处理错误等常见问题，使 Rust 程序更加健壮和可靠。

## 概念解释

### 为什么需要 Option 和 Result

在大多数编程语言中，空值（null/nil）和错误处理是两大常见的 bug 来源：

- **空指针异常**：C/C++ 的空指针、Java 的 NullPointerException、JavaScript 的 undefined 错误
- **未处理异常**：忘记捕获异常导致程序崩溃
- **错误码被忽略**：C 语言中返回值错误码常被忽视

Tony Hoare 称空引用为"十亿美元的错误"。Rust 通过类型系统从根本上解决这些问题：

- **没有 null**：Rust 中不存在 null 值，使用 `Option<T>` 显式表达"可能不存在"
- **没有异常**：Rust 使用 `Result<T, E>` 替代异常机制，错误必须被显式处理
- **编译时检查**：编译器强制要求处理所有可能的情况

### 历史背景

`Option` 和 `Result` 类型源自函数式编程语言（如 Haskell 的 `Maybe` 和 `Either`）。这种模式被称为"代数数据类型"（Algebraic Data Types），它将可能的状态编码在类型系统中，让编译器帮助捕获潜在错误。

## 核心原理

### Option<T> 的定义

`Option<T>` 是一个枚举类型，表示一个值可能存在（`Some`）或不存在（`None`）：

```rust
enum Option<T> {
    Some(T),  // 包含一个 T 类型的值
    None,     // 不包含值
}
```

由于 `Option` 非常常用，它和其变体（`Some`、`None`）被包含在 prelude 中，无需导入即可使用。

### Result<T, E> 的定义

`Result<T, E>` 也是一个枚举类型，表示操作可能成功（`Ok`）或失败（`Err`）：

```rust
enum Result<T, E> {
    Ok(T),   // 操作成功，包含成功值
    Err(E),  // 操作失败，包含错误信息
}
```

### 内存表示

Rust 编译器对 `Option` 进行了特殊优化。对于包含非空指针的类型（如 `&T`、`Box<T>`、`NonNull<T>`），`Option` 的大小与原类型相同：

```rust
use std::mem::size_of;

fn main() {
    // Option<Box<i32>> 与 Box<i32> 大小相同（都是 8 字节）
    assert_eq!(size_of::<Option<Box<i32>>>(), size_of::<Box<i32>>());

    // 因为 None 可以用空指针表示，无需额外空间
    println!("Box<i32>: {} bytes", size_of::<Box<i32>>());           // 8
    println!("Option<Box<i32>>: {} bytes", size_of::<Option<Box<i32>>>()); // 8
}
```

这种优化称为"空指针优化"（Null Pointer Optimization），使 `Option` 成为零成本抽象。

## 核心要点

### Option 的使用场景

1. **函数可能返回空值**

```rust
fn find_user(id: u64) -> Option<User> {
    if id == 0 {
        None
    } else {
        Some(User { id, name: String::from("Alice") })
    }
}
```

2. **可选字段**

```rust
struct Config {
    host: String,
    port: u16,
    timeout: Option<u64>,  // 可选的超时设置
}
```

3. **安全的数组/集合访问**

```rust
let numbers = vec![1, 2, 3];
let first: Option<&i32> = numbers.first();  // Some(&1)
let tenth: Option<&i32> = numbers.get(9);   // None
```

### Result 的使用场景

1. **文件操作**

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_file(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}
```

2. **解析操作**

```rust
fn parse_port(s: &str) -> Result<u16, std::num::ParseIntError> {
    s.parse::<u16>()
}
```

3. **网络请求**

```rust
fn fetch_data(url: &str) -> Result<Response, NetworkError> {
    // 网络操作可能失败
    // ...
}
```

### Option 与 Result 的关系

两者可以相互转换：

```rust
fn main() {
    // Option -> Result
    let opt: Option<i32> = Some(42);
    let res: Result<i32, &str> = opt.ok_or("值不存在");

    // Result -> Option
    let res: Result<i32, &str> = Ok(42);
    let opt: Option<i32> = res.ok();  // Some(42)

    let res: Result<i32, &str> = Err("错误");
    let opt: Option<i32> = res.ok();  // None
}
```

## 代码示例

### 基础用法：模式匹配

处理 `Option` 和 `Result` 最基本的方式是使用 `match`：

```rust
fn process_option(opt: Option<i32>) {
    match opt {
        Some(value) => println!("值为: {}", value),
        None => println!("没有值"),
    }
}

fn process_result(res: Result<i32, String>) {
    match res {
        Ok(value) => println!("成功: {}", value),
        Err(e) => println!("错误: {}", e),
    }
}

fn main() {
    process_option(Some(42));      // 输出: 值为: 42
    process_option(None);          // 输出: 没有值

    process_result(Ok(100));       // 输出: 成功: 100
    process_result(Err(String::from("失败"))); // 输出: 错误: 失败
}
```

### if let 和 while let

当只关心一种情况时，使用 `if let` 更简洁：

```rust
fn main() {
    let config_max = Some(3u8);

    // 使用 match
    match config_max {
        Some(max) => println!("最大值配置为 {}", max),
        _ => (),
    }

    // 使用 if let（更简洁）
    if let Some(max) = config_max {
        println!("最大值配置为 {}", max);
    }

    // if let 也支持 else
    if let Some(max) = config_max {
        println!("最大值: {}", max);
    } else {
        println!("未配置最大值");
    }
}
```

`while let` 用于循环处理：

```rust
fn main() {
    let mut stack = vec![1, 2, 3];

    // 持续弹出直到栈为空
    while let Some(top) = stack.pop() {
        println!("弹出: {}", top);
    }
}
```

### let-else 语法（Rust 1.65+）

`let-else` 语法允许在解构失败时提前返回：

```rust
fn get_username(id: u64) -> Option<String> {
    if id == 1 { Some(String::from("Alice")) } else { None }
}

fn process_user(id: u64) -> Result<(), String> {
    // 如果解构失败，执行 else 分支
    let Some(name) = get_username(id) else {
        return Err(String::from("用户不存在"));
    };

    println!("处理用户: {}", name);
    Ok(())
}
```

### 组合子方法：map

`map` 用于转换包含的值，同时保持包装器结构：

```rust
fn main() {
    // Option::map
    let maybe_string: Option<String> = Some(String::from("hello"));
    let maybe_len: Option<usize> = maybe_string.map(|s| s.len());
    println!("{:?}", maybe_len); // Some(5)

    let none_string: Option<String> = None;
    let none_len: Option<usize> = none_string.map(|s| s.len());
    println!("{:?}", none_len); // None（不执行闭包）

    // Result::map
    let ok_val: Result<i32, &str> = Ok(5);
    let doubled: Result<i32, &str> = ok_val.map(|x| x * 2);
    println!("{:?}", doubled); // Ok(10)

    let err_val: Result<i32, &str> = Err("错误");
    let doubled: Result<i32, &str> = err_val.map(|x| x * 2);
    println!("{:?}", doubled); // Err("错误")（不执行闭包）
}
```

### 组合子方法：and_then (flatMap)

`and_then` 用于链式操作，当函数返回 `Option` 或 `Result` 时避免嵌套：

```rust
fn square_root(x: f64) -> Option<f64> {
    if x >= 0.0 {
        Some(x.sqrt())
    } else {
        None
    }
}

fn inverse(x: f64) -> Option<f64> {
    if x != 0.0 {
        Some(1.0 / x)
    } else {
        None
    }
}

fn main() {
    // 链式调用
    let result = Some(4.0)
        .and_then(square_root)  // Some(2.0)
        .and_then(inverse);     // Some(0.5)
    println!("{:?}", result);   // Some(0.5)

    // 中途失败
    let result = Some(-4.0)
        .and_then(square_root)  // None
        .and_then(inverse);     // None（不执行）
    println!("{:?}", result);   // None

    // 对比：如果使用 map 会产生嵌套
    let nested: Option<Option<f64>> = Some(4.0).map(square_root);
    println!("{:?}", nested);   // Some(Some(2.0))
}
```

### 组合子方法：unwrap_or 系列

提供默认值或计算默认值：

```rust
fn main() {
    // unwrap_or: 提供默认值
    let x: Option<i32> = None;
    let value = x.unwrap_or(42);
    println!("{}", value); // 42

    // unwrap_or_else: 惰性计算默认值
    let x: Option<i32> = None;
    let value = x.unwrap_or_else(|| {
        println!("计算默认值...");
        expensive_computation()
    });

    // unwrap_or_default: 使用类型的 Default 实现
    let x: Option<String> = None;
    let value = x.unwrap_or_default();
    println!("{}", value); // ""（空字符串）

    // Result 也有相同的方法
    let res: Result<i32, &str> = Err("错误");
    let value = res.unwrap_or(0);
    println!("{}", value); // 0
}

fn expensive_computation() -> i32 {
    // 模拟耗时计算
    100
}
```

### 组合子方法：map_err

转换 `Result` 中的错误类型：

```rust
use std::num::ParseIntError;

#[derive(Debug)]
enum AppError {
    ParseError(String),
    IoError(String),
}

fn parse_number(s: &str) -> Result<i32, AppError> {
    s.parse::<i32>()
        .map_err(|e: ParseIntError| AppError::ParseError(e.to_string()))
}

fn main() {
    let result = parse_number("abc");
    println!("{:?}", result); // Err(ParseError("invalid digit found in string"))
}
```

### 组合子方法：or 和 or_else

提供备选值：

```rust
fn main() {
    // Option::or
    let x: Option<i32> = None;
    let y: Option<i32> = Some(100);
    println!("{:?}", x.or(y)); // Some(100)

    // Option::or_else
    let x: Option<i32> = None;
    let value = x.or_else(|| Some(compute_fallback()));

    // Result::or
    let x: Result<i32, &str> = Err("第一个错误");
    let y: Result<i32, &str> = Ok(42);
    println!("{:?}", x.or(y)); // Ok(42)
}

fn compute_fallback() -> i32 {
    42
}
```

### 组合子方法：filter

对 `Option` 中的值进行条件过滤：

```rust
fn main() {
    let some_number = Some(42);

    // 如果值满足条件，保持 Some；否则变为 None
    let filtered = some_number.filter(|&x| x > 50);
    println!("{:?}", filtered); // None

    let filtered = some_number.filter(|&x| x > 20);
    println!("{:?}", filtered); // Some(42)

    // 实用示例：验证输入
    fn validate_age(age: Option<u32>) -> Option<u32> {
        age.filter(|&a| a >= 18 && a <= 120)
    }

    println!("{:?}", validate_age(Some(25)));  // Some(25)
    println!("{:?}", validate_age(Some(10)));  // None
    println!("{:?}", validate_age(None));      // None
}
```

### ? 运算符

`?` 运算符是 Rust 错误处理的核心，用于简化错误传播：

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
    let mut file = File::open(path)?;  // 失败时自动返回 Err
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

### ? 运算符与 From trait

`?` 运算符会自动调用 `From` trait 进行错误类型转换：

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
    let mut file = File::open(path)?;  // io::Error 自动转换为 MyError
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    let number = contents.trim().parse::<i32>()?;  // ParseIntError 自动转换
    Ok(number)
}
```

### Option 中的 ? 运算符

`?` 也可以用于 `Option`：

```rust
fn get_first_char(s: &str) -> Option<char> {
    s.chars().next()
}

fn get_uppercase_first_char(s: &str) -> Option<char> {
    let first = get_first_char(s)?;  // 如果是 None，提前返回 None
    Some(first.to_ascii_uppercase())
}

fn main() {
    println!("{:?}", get_uppercase_first_char("hello")); // Some('H')
    println!("{:?}", get_uppercase_first_char(""));      // None
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
    let nested: Option<Option<i32>> = Some(Some(42));
    let flat: Option<i32> = nested.flatten();
    println!("{:?}", flat); // Some(42)

    // zip: 组合两个 Option
    let x = Some(1);
    let y = Some(2);
    let zipped = x.zip(y);
    println!("{:?}", zipped); // Some((1, 2))

    // zip_with: 组合并应用函数
    let x = Some(1);
    let y = Some(2);
    let sum = x.zip(y).map(|(a, b)| a + b);
    println!("{:?}", sum); // Some(3)

    // take: 取出值，留下 None
    let mut x = Some(42);
    let taken = x.take();
    println!("{:?}, {:?}", taken, x); // Some(42), None

    // replace: 替换值
    let mut x = Some(42);
    let old = x.replace(100);
    println!("{:?}, {:?}", old, x); // Some(42), Some(100)

    // ok_or 和 ok_or_else: Option -> Result
    let x: Option<i32> = None;
    let res: Result<i32, &str> = x.ok_or("值不存在");
    println!("{:?}", res); // Err("值不存在")
}
```

## 最佳实践

### 优先使用组合子而非 match

```rust
// 不推荐：过度使用 match
fn get_user_name(user: Option<User>) -> String {
    match user {
        Some(u) => u.name,
        None => String::from("Guest"),
    }
}

// 推荐：使用组合子
fn get_user_name(user: Option<User>) -> String {
    user.map(|u| u.name).unwrap_or_else(|| String::from("Guest"))
}
```

### 使用 ? 运算符简化错误传播

```rust
// 不推荐
fn process_file(path: &str) -> Result<Data, Error> {
    let content = match read_file(path) {
        Ok(c) => c,
        Err(e) => return Err(e),
    };
    let data = match parse_data(&content) {
        Ok(d) => d,
        Err(e) => return Err(e),
    };
    Ok(data)
}

// 推荐
fn process_file(path: &str) -> Result<Data, Error> {
    let content = read_file(path)?;
    let data = parse_data(&content)?;
    Ok(data)
}
```

### 避免滥用 unwrap

```rust
// 危险：可能 panic
fn bad_example(opt: Option<i32>) -> i32 {
    opt.unwrap()  // 如果是 None 会 panic
}

// 安全：提供默认值
fn good_example(opt: Option<i32>) -> i32 {
    opt.unwrap_or(0)
}

// 安全：传播错误
fn better_example(opt: Option<i32>) -> Result<i32, &'static str> {
    opt.ok_or("值不存在")
}

// 可接受：在确定有值时使用 expect
fn acceptable_expect() {
    let numbers = vec![1, 2, 3];
    // 我们知道 numbers 非空，使用 expect 提供上下文
    let first = numbers.first().expect("数组不应为空");
}
```

### 链式调用保持可读性

```rust
// 推荐：链式调用清晰易读
fn process_input(input: &str) -> Option<i32> {
    input
        .trim()
        .parse::<i32>()
        .ok()
        .filter(|&n| n > 0)
        .map(|n| n * 2)
}

// 不推荐：过长的链式调用难以调试
fn too_long_chain(input: &str) -> Option<String> {
    input.trim().parse::<i32>().ok()
        .filter(|&n| n > 0).map(|n| n * 2)
        .and_then(|n| some_operation(n)).map(|r| r.to_string())
        .filter(|s| !s.is_empty()).map(|s| s.to_uppercase())
}

// 推荐：适当断开，添加注释
fn readable_chain(input: &str) -> Option<String> {
    // 解析并验证输入
    let number = input
        .trim()
        .parse::<i32>()
        .ok()
        .filter(|&n| n > 0)?;

    // 处理并转换
    let result = some_operation(number * 2)?;

    // 格式化输出
    Some(result.to_string().to_uppercase())
}
```

### 使用类型别名简化复杂类型

```rust
// 定义类型别名
type ParseResult<T> = Result<T, ParseError>;

fn parse_config(content: &str) -> ParseResult<Config> {
    // ...
}

fn parse_user(content: &str) -> ParseResult<User> {
    // ...
}
```

## 常见陷阱

### 混淆 map 和 and_then

```rust
fn parse(s: &str) -> Option<i32> {
    s.parse().ok()
}

fn main() {
    // 错误：map 产生嵌套 Option
    let nested: Option<Option<i32>> = Some("42").map(parse);

    // 正确：and_then 展平结果
    let flat: Option<i32> = Some("42").and_then(parse);
}
```

### 忘记 ? 运算符需要正确的返回类型

```rust
// 错误：main 返回 ()，不能使用 ?
fn main() {
    let file = File::open("test.txt")?; // 编译错误!
}

// 正确方式 1：main 返回 Result
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let file = File::open("test.txt")?;
    Ok(())
}

// 正确方式 2：在 main 中处理错误
fn main() {
    match File::open("test.txt") {
        Ok(file) => { /* 使用 file */ }
        Err(e) => eprintln!("无法打开文件: {}", e),
    }
}
```

### 不必要的 clone

```rust
fn main() {
    let opt = Some(String::from("hello"));

    // 不推荐：不必要的 clone
    let len = opt.clone().map(|s| s.len());

    // 推荐：使用 as_ref
    let len = opt.as_ref().map(|s| s.len());

    // 现在 opt 仍然可用
    println!("{:?}", opt);
}
```

### unwrap_or 的求值时机

```rust
fn expensive() -> i32 {
    println!("执行耗时操作");
    42
}

fn main() {
    let x = Some(10);

    // unwrap_or 总是求值参数（即使不需要）
    let val = x.unwrap_or(expensive()); // 输出: 执行耗时操作

    // unwrap_or_else 惰性求值
    let val = x.unwrap_or_else(|| expensive()); // 不输出
}
```

### Option<&T> 与 &Option<T> 的区别

```rust
struct Container {
    value: Option<String>,
}

impl Container {
    // 返回 Option<&String>
    fn get_value(&self) -> Option<&String> {
        self.value.as_ref()
    }

    // 错误：返回对临时值的引用
    // fn get_value_bad(&self) -> &Option<String> {
    //     &self.value  // 这里返回的是对 Option 的引用，不是对内部值的引用
    // }
}
```

## 性能考量

### 零成本抽象

`Option` 和 `Result` 是零成本抽象：

1. **空指针优化**：`Option<&T>`、`Option<Box<T>>` 等不需要额外空间
2. **无运行时开销**：组合子方法在编译后被内联优化
3. **无异常开销**：不需要栈展开机制

```rust
use std::mem::size_of;

fn main() {
    // 零额外开销
    assert_eq!(size_of::<Option<&i32>>(), size_of::<&i32>());
    assert_eq!(size_of::<Option<Box<i32>>>(), size_of::<Box<i32>>());

    // 有额外开销（需要存储判别值）
    println!("Option<i32>: {} bytes", size_of::<Option<i32>>());     // 8
    println!("i32: {} bytes", size_of::<i32>());                      // 4
}
```

### 避免不必要的分配

```rust
// 不推荐：每次调用都创建新 String
fn bad_default() -> String {
    let opt: Option<String> = None;
    opt.unwrap_or(String::from("default"))
}

// 推荐：使用 &str 避免分配
fn good_default() -> &'static str {
    let opt: Option<&str> = None;
    opt.unwrap_or("default")
}

// 推荐：使用 Cow 灵活处理
use std::borrow::Cow;

fn flexible_default(opt: Option<String>) -> Cow<'static, str> {
    match opt {
        Some(s) => Cow::Owned(s),
        None => Cow::Borrowed("default"),
    }
}
```

### 内联与编译优化

```rust
// 组合子方法通常被内联
fn example(x: Option<i32>) -> i32 {
    x.map(|n| n * 2).unwrap_or(0)
}

// 编译后与手写代码性能相同
fn example_manual(x: Option<i32>) -> i32 {
    match x {
        Some(n) => n * 2,
        None => 0,
    }
}
```

## 实战场景

### 场景 1：配置文件解析

```rust
use std::collections::HashMap;

struct Config {
    host: String,
    port: u16,
    timeout: Option<u64>,
    max_connections: Option<u32>,
}

fn parse_config(values: &HashMap<String, String>) -> Result<Config, ConfigError> {
    let host = values
        .get("host")
        .cloned()
        .ok_or(ConfigError::Missing("host"))?;

    let port = values
        .get("port")
        .ok_or(ConfigError::Missing("port"))?
        .parse::<u16>()
        .map_err(|_| ConfigError::Invalid("port"))?;

    let timeout = values
        .get("timeout")
        .map(|s| s.parse::<u64>())
        .transpose()
        .map_err(|_| ConfigError::Invalid("timeout"))?;

    let max_connections = values
        .get("max_connections")
        .map(|s| s.parse::<u32>())
        .transpose()
        .map_err(|_| ConfigError::Invalid("max_connections"))?;

    Ok(Config { host, port, timeout, max_connections })
}

#[derive(Debug)]
enum ConfigError {
    Missing(&'static str),
    Invalid(&'static str),
}
```

### 场景 2：用户输入验证

```rust
#[derive(Debug)]
struct User {
    name: String,
    email: String,
    age: u8,
}

#[derive(Debug)]
enum ValidationError {
    EmptyName,
    InvalidEmail,
    InvalidAge(String),
    AgeTooYoung,
}

fn validate_user(
    name: &str,
    email: &str,
    age: &str,
) -> Result<User, ValidationError> {
    // 验证姓名
    let name = name.trim();
    if name.is_empty() {
        return Err(ValidationError::EmptyName);
    }

    // 验证邮箱
    if !email.contains('@') {
        return Err(ValidationError::InvalidEmail);
    }

    // 验证年龄
    let age: u8 = age
        .trim()
        .parse()
        .map_err(|_| ValidationError::InvalidAge(age.to_string()))?;

    if age < 18 {
        return Err(ValidationError::AgeTooYoung);
    }

    Ok(User {
        name: name.to_string(),
        email: email.to_string(),
        age,
    })
}
```

### 场景 3：链式 API 调用

```rust
struct ApiClient {
    base_url: String,
}

impl ApiClient {
    fn get_user(&self, id: u64) -> Result<User, ApiError> {
        // 模拟 API 调用
        Ok(User { id, name: String::from("Alice"), department_id: Some(10) })
    }

    fn get_department(&self, id: u64) -> Result<Department, ApiError> {
        Ok(Department { id, name: String::from("Engineering"), manager_id: Some(1) })
    }

    fn get_manager(&self, user_id: u64) -> Result<Option<User>, ApiError> {
        // 获取用户的部门经理
        let user = self.get_user(user_id)?;

        let department = user
            .department_id
            .map(|id| self.get_department(id))
            .transpose()?;  // Option<Result<T, E>> -> Result<Option<T>, E>

        let manager = department
            .and_then(|d| d.manager_id)
            .map(|id| self.get_user(id))
            .transpose()?;

        Ok(manager)
    }
}

struct User {
    id: u64,
    name: String,
    department_id: Option<u64>,
}

struct Department {
    id: u64,
    name: String,
    manager_id: Option<u64>,
}

#[derive(Debug)]
struct ApiError(String);
```

### 场景 4：错误恢复与重试

```rust
use std::time::Duration;
use std::thread;

fn fetch_with_retry<T, E>(
    mut operation: impl FnMut() -> Result<T, E>,
    max_retries: u32,
    delay: Duration,
) -> Result<T, E> {
    let mut last_error = None;

    for attempt in 0..=max_retries {
        match operation() {
            Ok(value) => return Ok(value),
            Err(e) => {
                last_error = Some(e);
                if attempt < max_retries {
                    thread::sleep(delay);
                }
            }
        }
    }

    Err(last_error.unwrap())  // 安全：至少尝试了一次
}

// 使用示例
fn main() {
    let result = fetch_with_retry(
        || fetch_data("https://api.example.com/data"),
        3,
        Duration::from_secs(1),
    );

    match result {
        Ok(data) => println!("获取数据成功: {:?}", data),
        Err(e) => println!("重试后仍然失败: {:?}", e),
    }
}

fn fetch_data(url: &str) -> Result<String, String> {
    // 模拟网络请求
    Err(String::from("连接超时"))
}
```

## 面试要点

### 高频面试题

**1. Option 和 Result 的区别是什么？**

- `Option<T>` 表示值可能存在或不存在，用于处理空值
- `Result<T, E>` 表示操作可能成功或失败，用于错误处理
- `Option` 是 `Result<T, ()>` 的特化版本

**2. 什么时候使用 unwrap？**

- 在原型开发或测试代码中快速验证
- 当你确定值一定存在时（配合注释说明原因）
- 使用 `expect` 替代 `unwrap`，提供错误上下文

**3. ? 运算符的工作原理是什么？**

- 对于 `Result`：成功时解包值，失败时提前返回 `Err`
- 对于 `Option`：有值时解包，无值时返回 `None`
- 自动调用 `From` trait 进行错误类型转换

**4. map 和 and_then 的区别？**

- `map` 对内部值应用函数，保持包装器结构
- `and_then` 对内部值应用返回 Option/Result 的函数，并展平结果
- `map(f)` 可能产生 `Option<Option<T>>`，`and_then(f)` 产生 `Option<T>`

**5. 如何处理多个 Option/Result？**

```rust
// 使用 ? 运算符链式处理
fn example() -> Option<i32> {
    let a = get_a()?;
    let b = get_b()?;
    Some(a + b)
}

// 使用 zip 组合
let result = opt_a.zip(opt_b).map(|(a, b)| a + b);

// 使用 and_then 链式处理
let result = opt_a.and_then(|a| opt_b.map(|b| a + b));
```

**6. 什么是空指针优化？**

对于包含非空指针的类型，编译器使用空指针表示 `None`，因此 `Option<&T>` 与 `&T` 大小相同。

**7. 如何在迭代器中处理 Option/Result？**

```rust
// filter_map: 过滤并映射 Option
let numbers: Vec<i32> = strings
    .iter()
    .filter_map(|s| s.parse().ok())
    .collect();

// collect 收集 Result
let results: Result<Vec<i32>, _> = strings
    .iter()
    .map(|s| s.parse::<i32>())
    .collect();
```

## 延伸阅读

### 官方文档

- [Rust 标准库 - Option](https://doc.rust-lang.org/std/option/)
- [Rust 标准库 - Result](https://doc.rust-lang.org/std/result/)
- [Rust Book - 错误处理](https://doc.rust-lang.org/book/ch09-00-error-handling.html)
- [Rust by Example - Option](https://doc.rust-lang.org/rust-by-example/std/option.html)

### 推荐库

- **thiserror**：简化自定义错误类型的定义
- **anyhow**：应用程序级别的错误处理
- **miette**：美观的错误报告
- **color-eyre**：彩色错误堆栈追踪

### 进阶主题

- **Error trait**：自定义错误类型的实现
- **? 运算符与 Try trait**：底层实现机制
- **错误处理最佳实践**：库与应用程序的不同策略
- **async 中的错误处理**：异步代码中的 Option 和 Result

### 相关文章

- [Rust 错误处理](/rust/error-handling) - 深入探讨错误处理策略
- [Rust 模式匹配](/rust/pattern-matching) - 与 Option/Result 配合使用
- [Rust 所有权系统](/rust/ownership) - 理解值的所有权转移
