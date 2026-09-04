---
title: 宏
description: Rust宏完全指南，声明式宏与过程宏
track: rust
section: traits-generics
difficulty: advanced
tags:
  - Rust
  - 宏
  - 元编程
  - macro_rules
status: imported
origin: old/src/content/docs/rust/macros.zh.md
divergence: 0.215
issues: []
legacy:
  category: Rust
  subcategory: 元编程
  order: 7
  lastUpdated: 2026-01-07
---

宏是 Rust 中强大的元编程工具，允许你编写能够生成其他代码的代码。与函数不同，宏在编译时展开，可以接受可变数量的参数，并能操作 Rust 的语法结构。

## 为什么需要宏？

宏解决了以下核心问题：

1. **减少重复代码**：自动生成样板代码，避免复制粘贴
2. **可变参数**：处理不定数量的参数（如 `println!`、`vec!`）
3. **DSL（领域特定语言）**：创建特定领域的语法
4. **编译时计算**：在编译期执行代码生成和验证
5. **trait 实现自动化**：自动为类型实现 trait

## 宏的分类

Rust 中的宏分为两大类：

1. **声明式宏（Declarative Macros）**：使用 `macro_rules!` 定义，通过模式匹配来生成代码
2. **过程宏（Procedural Macros）**：更强大的宏，可以操作 Rust 代码的抽象语法树（AST）
   - 派生宏（Derive Macros）
   - 属性宏（Attribute Macros）
   - 函数式宏（Function-like Macros）

---

## 声明式宏（macro_rules!）

声明式宏是最常见的宏类型，使用模式匹配的方式来定义代码转换规则。

### 基本语法

```rust
macro_rules! 宏名称 {
    (模式1) => {
        展开代码1
    };
    (模式2) => {
        展开代码2
    };
}
```

### 简单示例

```rust
macro_rules! say_hello {
    () => {
        println!("Hello, World!");
    };
}

fn main() {
    say_hello!(); // 输出: Hello, World!
}
```

### 带参数的宏

```rust
macro_rules! greet {
    ($name:expr) => {
        println!("你好, {}!", $name);
    };
}

fn main() {
    greet!("张三"); // 输出: 你好, 张三!
}
```

### 片段说明符（Fragment Specifiers）

宏参数使用片段说明符来指定接受的语法类型：

| 说明符 | 描述 | 示例 |
|--------|------|------|
| `expr` | 表达式 | `1 + 2`, `foo()` |
| `ident` | 标识符 | `foo`, `bar` |
| `ty` | 类型 | `i32`, `Vec<String>` |
| `path` | 路径 | `std::collections::HashMap` |
| `pat` | 模式 | `Some(x)`, `_` |
| `stmt` | 语句 | `let x = 1;` |
| `block` | 代码块 | `{ ... }` |
| `item` | 项（函数、结构体等） | `fn foo() {}` |
| `meta` | 元数据 | `cfg(target_os = "linux")` |
| `tt` | 单个 token 树 | 任何 token |
| `literal` | 字面量 | `"hello"`, `42` |
| `lifetime` | 生命周期 | `'a`, `'static` |
| `vis` | 可见性修饰符 | `pub`, `pub(crate)` |

```rust
macro_rules! create_function {
    ($func_name:ident) => {
        fn $func_name() {
            println!("函数 {:?} 被调用", stringify!($func_name));
        }
    };
}

create_function!(foo);
create_function!(bar);

fn main() {
    foo(); // 输出: 函数 "foo" 被调用
    bar(); // 输出: 函数 "bar" 被调用
}
```

### 重复模式

宏支持重复模式，用于处理可变数量的参数：

```rust
macro_rules! vector {
    // 基础情况：空向量
    () => {
        Vec::new()
    };
    // 重复模式：一个或多个元素
    ($($element:expr),+ $(,)?) => {
        {
            let mut v = Vec::new();
            $(
                v.push($element);
            )+
            v
        }
    };
}

fn main() {
    let v1: Vec<i32> = vector![];
    let v2 = vector![1, 2, 3];
    let v3 = vector![1, 2, 3,]; // 支持尾随逗号

    println!("{:?}", v2); // [1, 2, 3]
}
```

重复语法说明：
- `$(...)*` - 零次或多次
- `$(...)+` - 一次或多次
- `$(...)?` - 零次或一次
- 分隔符可以是 `,`、`;` 等

### 多分支模式匹配

```rust
macro_rules! calculate {
    // 加法
    (add $a:expr, $b:expr) => {
        $a + $b
    };
    // 减法
    (sub $a:expr, $b:expr) => {
        $a - $b
    };
    // 乘法
    (mul $a:expr, $b:expr) => {
        $a * $b
    };
    // 多个数字相加
    (sum $($x:expr),+) => {
        {
            let mut sum = 0;
            $(
                sum += $x;
            )+
            sum
        }
    };
}

fn main() {
    println!("{}", calculate!(add 5, 3));       // 8
    println!("{}", calculate!(sub 10, 4));      // 6
    println!("{}", calculate!(mul 3, 7));       // 21
    println!("{}", calculate!(sum 1, 2, 3, 4)); // 10
}
```

### 递归宏

宏可以递归调用自身：

```rust
macro_rules! count_exprs {
    () => { 0 };
    ($head:expr) => { 1 };
    ($head:expr, $($tail:expr),+) => {
        1 + count_exprs!($($tail),+)
    };
}

macro_rules! find_min {
    ($x:expr) => ($x);
    ($x:expr, $($y:expr),+) => {
        std::cmp::min($x, find_min!($($y),+))
    };
}

fn main() {
    println!("{}", count_exprs!());           // 0
    println!("{}", count_exprs!(1));          // 1
    println!("{}", count_exprs!(1, 2, 3, 4)); // 4

    println!("{}", find_min!(5));           // 5
    println!("{}", find_min!(3, 7, 2, 9));  // 2
}
```

### 实用示例：HashMap 构造宏

```rust
macro_rules! hashmap {
    () => {
        ::std::collections::HashMap::new()
    };
    ($($key:expr => $value:expr),+ $(,)?) => {
        {
            let mut map = ::std::collections::HashMap::new();
            $(
                map.insert($key, $value);
            )+
            map
        }
    };
}

fn main() {
    let scores = hashmap! {
        "Alice" => 95,
        "Bob" => 87,
        "Charlie" => 92,
    };

    println!("{:?}", scores);
}
```

### 实用示例：测试辅助宏

```rust
macro_rules! assert_approx_eq {
    ($left:expr, $right:expr) => {
        assert_approx_eq!($left, $right, 1e-6)
    };
    ($left:expr, $right:expr, $epsilon:expr) => {
        {
            let left_val = $left;
            let right_val = $right;
            let diff = (left_val - right_val).abs();
            if diff > $epsilon {
                panic!(
                    "断言失败: {} ≈ {}\n  左值: {}\n  右值: {}\n  差值: {} (允许误差: {})",
                    stringify!($left),
                    stringify!($right),
                    left_val,
                    right_val,
                    diff,
                    $epsilon
                );
            }
        }
    };
}

fn main() {
    let pi = 3.14159265;
    assert_approx_eq!(pi, 3.14159, 0.0001);
    assert_approx_eq!(0.1 + 0.2, 0.3, 1e-10);
}
```

---

## 宏的卫生性（Hygiene）

Rust 宏具有部分卫生性，这意味着宏内部定义的标识符不会与外部作用域的标识符冲突。

### 卫生性示例

```rust
macro_rules! using_a {
    () => {
        let a = 42;
        println!("宏内部的 a: {}", a);
    };
}

fn main() {
    let a = 10;
    using_a!();                           // 宏内部的 a: 42
    println!("main 中的 a: {}", a);        // main 中的 a: 10
}
```

### 创建外部可见的标识符

有时需要在宏中创建可被外部访问的变量：

```rust
macro_rules! create_variable {
    ($name:ident) => {
        let $name = 42;
    };
}

macro_rules! create_function {
    ($name:ident) => {
        fn $name() {
            println!("函数 {} 被调用", stringify!($name));
        }
    };
}

create_function!(hello);
create_function!(world);

fn main() {
    create_variable!(x);
    println!("x = {}", x); // 42

    hello(); // 函数 hello 被调用
    world(); // 函数 world 被调用
}
```

---

## 宏的导入与导出

### 模块内宏

```rust
// 在当前 crate 内使用
#[macro_use]
mod macros {
    macro_rules! my_macro {
        () => { println!("来自 macros 模块"); };
    }
}

fn main() {
    my_macro!();
}
```

### 导出宏到其他 crate

```rust
// lib.rs
#[macro_export]
macro_rules! public_macro {
    () => {
        println!("这是一个公开的宏");
    };
}
```

使用时：

```rust
// 方式1：使用 #[macro_use]
#[macro_use]
extern crate my_crate;

// 方式2：使用路径导入（Rust 2018+，推荐）
use my_crate::public_macro;

fn main() {
    public_macro!();
}
```

---

## 过程宏（Procedural Macros）

过程宏比声明式宏更强大，它们是编译器插件，可以操作 Rust 代码的 TokenStream。过程宏必须定义在独立的 crate 中，且该 crate 需要设置 `proc-macro = true`。

### 设置过程宏 crate

```toml
# Cargo.toml
[package]
name = "my_macro"
version = "0.1.0"
edition = "2021"

[lib]
proc-macro = true

[dependencies]
syn = { version = "2.0", features = ["full"] }
quote = "1.0"
proc-macro2 = "1.0"
```

### 核心库介绍

#### syn

`syn` 用于解析 Rust 代码的 TokenStream：

```rust
use syn::{parse_macro_input, DeriveInput};

// 解析结构体定义
let ast: DeriveInput = parse_macro_input!(input);
```

主要类型：
- `DeriveInput`：派生宏输入（结构体、枚举、联合体）
- `ItemFn`：函数定义
- `Expr`：表达式
- `Type`：类型

#### quote

`quote` 用于生成 Rust 代码：

```rust
use quote::quote;

let tokens = quote! {
    fn hello() {
        println!("Hello from macro!");
    }
};
```

特性：
- `#var`：插入变量
- `#(#iter)*`：迭代展开

---

## 派生宏（Derive Macros）

派生宏用于自动为类型实现 trait。

### 简单的派生宏

```rust
// my_macro/src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(HelloWorld)]
pub fn hello_world_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;

    let gen = quote! {
        impl HelloWorld for #name {
            fn hello_world() {
                println!("Hello, World! 我是 {}", stringify!(#name));
            }
        }
    };

    gen.into()
}
```

使用派生宏：

```rust
use my_macro::HelloWorld;

trait HelloWorld {
    fn hello_world();
}

#[derive(HelloWorld)]
struct MyStruct;

fn main() {
    MyStruct::hello_world(); // Hello, World! 我是 MyStruct
}
```

### 处理字段的派生宏

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Data, Fields};

#[proc_macro_derive(Describe)]
pub fn describe_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;

    // 获取字段信息
    let fields = match &ast.data {
        Data::Struct(data) => {
            match &data.fields {
                Fields::Named(fields) => {
                    let field_names = fields.named.iter().map(|f| {
                        let name = &f.ident;
                        quote! { stringify!(#name) }
                    });
                    quote! { vec![#(#field_names),*] }
                }
                _ => quote! { vec![] }
            }
        }
        _ => quote! { vec![] }
    };

    let gen = quote! {
        impl Describe for #name {
            fn describe() -> String {
                let fields: Vec<&str> = #fields;
                format!("{} has fields: {}", stringify!(#name), fields.join(", "))
            }
        }
    };

    gen.into()
}
```

使用示例：

```rust
trait Describe {
    fn describe() -> String;
}

#[derive(Describe)]
struct Person {
    name: String,
    age: u32,
    email: String,
}

fn main() {
    println!("{}", Person::describe());
    // Person has fields: name, age, email
}
```

### 带属性的派生宏：Builder 模式

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Data, Fields};

#[proc_macro_derive(Builder, attributes(builder))]
pub fn builder_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;
    let builder_name = syn::Ident::new(
        &format!("{}Builder", name),
        name.span()
    );

    let fields = match &ast.data {
        Data::Struct(data) => match &data.fields {
            Fields::Named(fields) => &fields.named,
            _ => panic!("Builder 只支持命名字段的结构体"),
        },
        _ => panic!("Builder 只支持结构体"),
    };

    let builder_fields = fields.iter().map(|f| {
        let name = &f.ident;
        let ty = &f.ty;
        quote! { #name: Option<#ty> }
    });

    let builder_defaults = fields.iter().map(|f| {
        let name = &f.ident;
        quote! { #name: None }
    });

    let builder_methods = fields.iter().map(|f| {
        let name = &f.ident;
        let ty = &f.ty;
        quote! {
            pub fn #name(mut self, value: #ty) -> Self {
                self.#name = Some(value);
                self
            }
        }
    });

    let build_fields = fields.iter().map(|f| {
        let name = &f.ident;
        let name_str = name.as_ref().map(|n| n.to_string()).unwrap_or_default();
        quote! {
            #name: self.#name.ok_or(format!("字段 {} 未设置", #name_str))?
        }
    });

    let gen = quote! {
        pub struct #builder_name {
            #(#builder_fields,)*
        }

        impl #name {
            pub fn builder() -> #builder_name {
                #builder_name {
                    #(#builder_defaults,)*
                }
            }
        }

        impl #builder_name {
            #(#builder_methods)*

            pub fn build(self) -> Result<#name, String> {
                Ok(#name {
                    #(#build_fields,)*
                })
            }
        }
    };

    gen.into()
}
```

使用 Builder 宏：

```rust
use my_macro::Builder;

#[derive(Builder, Debug)]
struct User {
    name: String,
    age: u32,
    email: String,
}

fn main() {
    let user = User::builder()
        .name("张三".to_string())
        .age(25)
        .email("zhangsan@example.com".to_string())
        .build()
        .unwrap();

    println!("{:?}", user);
}
```

---

## 属性宏（Attribute Macros）

属性宏可以创建自定义属性，比派生宏更灵活，可以附加到任何项上。

### 基本属性宏：计时器

```rust
// my_macro/src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn};

#[proc_macro_attribute]
pub fn timing(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let input_fn = parse_macro_input!(item as ItemFn);
    let fn_name = &input_fn.sig.ident;
    let fn_block = &input_fn.block;
    let fn_vis = &input_fn.vis;
    let fn_sig = &input_fn.sig;

    let gen = quote! {
        #fn_vis #fn_sig {
            let start = std::time::Instant::now();
            let result = (|| #fn_block)();
            let duration = start.elapsed();
            println!("函数 {} 执行时间: {:?}", stringify!(#fn_name), duration);
            result
        }
    };

    gen.into()
}
```

使用：

```rust
use my_macro::timing;

#[timing]
fn expensive_operation() -> u64 {
    std::thread::sleep(std::time::Duration::from_millis(100));
    42
}

fn main() {
    let result = expensive_operation();
    println!("结果: {}", result);
    // 函数 expensive_operation 执行时间: 100.123ms
    // 结果: 42
}
```

### 带参数的属性宏：日志级别

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn};

#[proc_macro_attribute]
pub fn log_call(attr: TokenStream, item: TokenStream) -> TokenStream {
    let input_fn = parse_macro_input!(item as ItemFn);
    let fn_name = &input_fn.sig.ident;
    let fn_block = &input_fn.block;
    let fn_vis = &input_fn.vis;
    let fn_sig = &input_fn.sig;

    let level = if attr.is_empty() {
        "INFO".to_string()
    } else {
        attr.to_string().trim().to_uppercase()
    };

    let gen = quote! {
        #fn_vis #fn_sig {
            println!("[{}] 进入函数: {}", #level, stringify!(#fn_name));
            let start = std::time::Instant::now();
            let result = (|| #fn_block)();
            let duration = start.elapsed();
            println!("[{}] 离开函数: {}，耗时: {:?}", #level, stringify!(#fn_name), duration);
            result
        }
    };

    gen.into()
}
```

使用：

```rust
use my_macro::log_call;

#[log_call]
fn process_data(data: &str) -> usize {
    std::thread::sleep(std::time::Duration::from_millis(100));
    data.len()
}

#[log_call(debug)]
fn calculate(x: i32, y: i32) -> i32 {
    x + y
}

fn main() {
    let len = process_data("Hello, World!");
    println!("长度: {}", len);

    let sum = calculate(10, 20);
    println!("和: {}", sum);
}
```

---

## 函数式宏（Function-like Macros）

函数式过程宏看起来像函数调用，但可以接受任意 token，提供更大的灵活性。

### SQL 验证宏

```rust
// my_macro/src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, LitStr};

#[proc_macro]
pub fn sql(input: TokenStream) -> TokenStream {
    let input_str = parse_macro_input!(input as LitStr);
    let sql_query = input_str.value();

    // 简单的 SQL 验证
    let sql_upper = sql_query.to_uppercase();
    if !sql_upper.starts_with("SELECT")
        && !sql_upper.starts_with("INSERT")
        && !sql_upper.starts_with("UPDATE")
        && !sql_upper.starts_with("DELETE")
    {
        return syn::Error::new(
            input_str.span(),
            "SQL 必须以 SELECT、INSERT、UPDATE 或 DELETE 开头"
        ).to_compile_error().into();
    }

    let gen = quote! {
        {
            println!("执行 SQL: {}", #sql_query);
            #sql_query
        }
    };

    gen.into()
}
```

使用：

```rust
use my_macro::sql;

fn main() {
    let query = sql!("SELECT * FROM users WHERE id = 1");
    println!("查询: {}", query);

    // 以下会在编译时报错：
    // let bad = sql!("DROP TABLE users");
}
```

### 自定义解析的函数式宏

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse::{Parse, ParseStream}, Token, Ident, LitStr};

struct RouteInput {
    method: Ident,
    path: LitStr,
    handler: Ident,
}

impl Parse for RouteInput {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let method: Ident = input.parse()?;
        input.parse::<Token![,]>()?;
        let path: LitStr = input.parse()?;
        input.parse::<Token![,]>()?;
        let handler: Ident = input.parse()?;

        Ok(RouteInput { method, path, handler })
    }
}

#[proc_macro]
pub fn route(input: TokenStream) -> TokenStream {
    let RouteInput { method, path, handler } =
        syn::parse_macro_input!(input as RouteInput);

    let gen = quote! {
        Route {
            method: stringify!(#method).to_uppercase(),
            path: #path.to_string(),
            handler: #handler,
        }
    };

    gen.into()
}
```

使用：

```rust
struct Route {
    method: String,
    path: String,
    handler: fn(),
}

fn index_handler() {
    println!("Index page");
}

fn main() {
    let r = route!(GET, "/index", index_handler);
    println!("Route: {} {}", r.method, r.path);
}
```

---

## 常用宏模式

### 内部规则模式

使用 `@` 前缀来定义内部辅助规则，避免公开 API 污染：

```rust
macro_rules! count_tts {
    // 公开入口
    ($($tts:tt)*) => {
        count_tts!(@count 0, $($tts)*)
    };
    // 内部规则
    (@count $acc:expr,) => { $acc };
    (@count $acc:expr, $_tt:tt $($rest:tt)*) => {
        count_tts!(@count ($acc + 1), $($rest)*)
    };
}

fn main() {
    println!("{}", count_tts!(a b c d e)); // 5
}
```

### 累加器模式

```rust
macro_rules! reverse {
    // 入口：初始化空累加器
    ($($items:expr),*) => {
        reverse!(@acc [], $($items),*)
    };
    // 基础情况：所有项已处理
    (@acc [$($reversed:expr),*],) => {
        vec![$($reversed),*]
    };
    // 递归：将第一项移到累加器前面
    (@acc [$($reversed:expr),*], $first:expr $(, $rest:expr)*) => {
        reverse!(@acc [$first $(, $reversed)*], $($rest),*)
    };
}

fn main() {
    let v = reverse![1, 2, 3, 4, 5];
    println!("{:?}", v); // [5, 4, 3, 2, 1]
}
```

### TT Muncher（Token 树消耗器）

逐个处理 token，适合处理混合语法：

```rust
macro_rules! mixed_rules {
    () => {};
    (add $a:expr, $b:expr; $($tail:tt)*) => {
        {
            println!("{} + {} = {}", $a, $b, $a + $b);
            mixed_rules!($($tail)*);
        }
    };
    (mul $a:expr, $b:expr; $($tail:tt)*) => {
        {
            println!("{} * {} = {}", $a, $b, $a * $b);
            mixed_rules!($($tail)*);
        }
    };
}

fn main() {
    mixed_rules! {
        add 1, 2;
        mul 3, 4;
        add 5, 6;
    }
    // 1 + 2 = 3
    // 3 * 4 = 12
    // 5 + 6 = 11
}
```

### 回调模式

```rust
macro_rules! call_with_values {
    ($callback:ident, $($values:expr),*) => {
        $callback!($($values),*)
    };
}

macro_rules! sum {
    ($($x:expr),*) => {
        {
            let mut total = 0;
            $(total += $x;)*
            total
        }
    };
}

macro_rules! product {
    ($($x:expr),*) => {
        {
            let mut total = 1;
            $(total *= $x;)*
            total
        }
    };
}

fn main() {
    let s = call_with_values!(sum, 1, 2, 3, 4, 5);
    let p = call_with_values!(product, 1, 2, 3, 4, 5);
    println!("和: {}, 积: {}", s, p); // 和: 15, 积: 120
}
```

---

## 实战案例

### 简单测试框架

```rust
static mut PASSED: usize = 0;
static mut FAILED: usize = 0;

macro_rules! test_case {
    ($name:ident, $body:block) => {
        fn $name() {
            print!("测试 {} ... ", stringify!($name));
            let result = std::panic::catch_unwind(|| $body);
            match result {
                Ok(_) => {
                    println!("通过");
                    unsafe { PASSED += 1; }
                }
                Err(_) => {
                    println!("失败");
                    unsafe { FAILED += 1; }
                }
            }
        }
    };
}

macro_rules! assert_eq_custom {
    ($left:expr, $right:expr) => {
        if $left != $right {
            panic!("断言失败: {} != {}", $left, $right);
        }
    };
    ($left:expr, $right:expr, $msg:expr) => {
        if $left != $right {
            panic!("{}: {} != {}", $msg, $left, $right);
        }
    };
}

macro_rules! run_tests {
    ($($test:ident),* $(,)?) => {
        fn main() {
            println!("运行测试...\n");
            $($test();)*
            println!("\n测试完成:");
            unsafe {
                println!("  通过: {}", PASSED);
                println!("  失败: {}", FAILED);
            }
        }
    };
}

test_case!(test_addition, {
    assert_eq_custom!(2 + 2, 4);
});

test_case!(test_subtraction, {
    assert_eq_custom!(5 - 3, 2);
});

test_case!(test_will_fail, {
    assert_eq_custom!(1, 2, "故意失败的测试");
});

run_tests!(test_addition, test_subtraction, test_will_fail);
```

### HTML DSL 构建器

```rust
macro_rules! html {
    // 自闭合标签
    ($tag:ident []) => {
        format!("<{} />", stringify!($tag))
    };

    // 带属性的自闭合标签
    ($tag:ident [$($attr:ident = $val:expr),*]) => {
        format!(
            "<{} {} />",
            stringify!($tag),
            vec![$(format!("{}=\"{}\"", stringify!($attr), $val)),*].join(" ")
        )
    };

    // 带内容的标签
    ($tag:ident { $($inner:tt)* }) => {
        format!(
            "<{}>{}</{}>",
            stringify!($tag),
            html!(@inner $($inner)*),
            stringify!($tag)
        )
    };

    // 带属性和内容的标签
    ($tag:ident [$($attr:ident = $val:expr),*] { $($inner:tt)* }) => {
        format!(
            "<{} {}>{}</{}>",
            stringify!($tag),
            vec![$(format!("{}=\"{}\"", stringify!($attr), $val)),*].join(" "),
            html!(@inner $($inner)*),
            stringify!($tag)
        )
    };

    // 内部规则：处理内容
    (@inner) => { String::new() };
    (@inner $text:literal) => { $text.to_string() };
    (@inner $($tag:ident $($rest:tt)*);* $(;)?) => {
        vec![$(html!($tag $($rest)*)),*].join("")
    };
}

fn main() {
    let page = html! {
        html {
            head {
                title { "我的页面" }
            };
            body [class = "main"] {
                h1 { "欢迎" };
                p { "这是一个段落。" };
                br [];
                div [id = "content", class = "container"] {
                    span { "嵌套内容" }
                }
            }
        }
    };

    println!("{}", page);
}
```

### 枚举辅助方法自动生成

```rust
#[proc_macro_derive(EnumMethods)]
pub fn enum_methods_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;

    let variants = match &ast.data {
        Data::Enum(data) => &data.variants,
        _ => panic!("EnumMethods only works on enums"),
    };

    let variant_names: Vec<_> = variants.iter()
        .map(|v| &v.ident)
        .collect();

    let as_str_arms = variants.iter().map(|v| {
        let variant = &v.ident;
        let name_str = variant.to_string();
        quote! { #name::#variant => #name_str }
    });

    let from_str_arms = variants.iter().map(|v| {
        let variant = &v.ident;
        let name_str = variant.to_string();
        quote! { #name_str => Ok(#name::#variant) }
    });

    let gen = quote! {
        impl #name {
            pub fn as_str(&self) -> &'static str {
                match self {
                    #(#as_str_arms,)*
                }
            }

            pub fn variants() -> &'static [&'static str] {
                &[#(stringify!(#variant_names)),*]
            }

            pub fn from_str(s: &str) -> Result<Self, String> {
                match s {
                    #(#from_str_arms,)*
                    _ => Err(format!("Unknown variant: {}", s))
                }
            }
        }
    };

    gen.into()
}
```

使用：

```rust
#[derive(EnumMethods)]
enum Color {
    Red,
    Green,
    Blue,
}

fn main() {
    println!("{}", Color::Red.as_str());   // "Red"
    println!("{:?}", Color::variants());    // ["Red", "Green", "Blue"]

    let color = Color::from_str("Green").unwrap();
    println!("{}", color.as_str());         // "Green"
}
```

---

## 调试宏

### 使用 cargo expand

```bash
# 安装 cargo-expand
cargo install cargo-expand

# 查看宏展开后的代码
cargo expand

# 查看特定函数的宏展开
cargo expand --lib fn_name
```

### 使用 trace_macros（nightly）

```rust
#![feature(trace_macros)]

trace_macros!(true);
let v = vec![1, 2, 3];
trace_macros!(false);
```

### 使用 stringify! 调试

```rust
macro_rules! debug_print {
    ($expr:expr) => {
        println!("{} = {:?}", stringify!($expr), $expr);
    };
}

fn main() {
    let x = 42;
    debug_print!(x);        // x = 42
    debug_print!(x * 2);    // x * 2 = 84
    debug_print!(vec![1,2]); // vec![1, 2] = [1, 2]
}
```

### 过程宏调试

```rust
#[proc_macro]
pub fn my_macro(input: TokenStream) -> TokenStream {
    // 打印输入的 token
    eprintln!("Input tokens: {}", input);

    let ast = parse_macro_input!(input as DeriveInput);
    eprintln!("Parsed AST: {:#?}", ast);

    let output = quote! { /* ... */ };
    eprintln!("Output tokens: {}", output);

    output.into()
}
```

---

## 最佳实践

### 错误处理

使用 `syn::Error` 提供友好的编译时错误信息：

```rust
use syn::{Error, spanned::Spanned};

#[proc_macro_derive(MyMacro)]
pub fn my_macro_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);

    match &ast.data {
        Data::Struct(_) => { /* 正常处理 */ }
        _ => {
            return Error::new(
                ast.span(),
                "MyMacro 只支持结构体"
            )
            .to_compile_error()
            .into();
        }
    }

    // ...
}
```

### 使用完整路径

避免依赖导入的名称，使用完整路径：

```rust
macro_rules! create_vec {
    ($($elem:expr),*) => {
        // 使用完整路径，避免名称冲突
        ::std::vec![$($elem),*]
    };
}
```

### 保持宏简单

- 优先使用函数，只在必要时使用宏
- 每个宏只做一件事
- 将复杂逻辑提取到辅助函数

```rust
fn impl_my_trait(ast: &DeriveInput) -> TokenStream {
    let name = &ast.ident;
    let gen = quote! {
        impl MyTrait for #name {
            // ...
        }
    };
    gen.into()
}

#[proc_macro_derive(MyTrait)]
pub fn my_trait_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    impl_my_trait(&ast)
}
```

### 文档化宏

```rust
/// 创建一个包含指定元素的 HashMap。
///
/// # 示例
///
/// ```
/// let map = hashmap! {
///     "key1" => "value1",
///     "key2" => "value2",
/// };
/// assert_eq!(map.get("key1"), Some(&"value1"));
/// ```
#[macro_export]
macro_rules! hashmap {
    ($($key:expr => $value:expr),* $(,)?) => {
        {
            let mut map = ::std::collections::HashMap::new();
            $(map.insert($key, $value);)*
            map
        }
    };
}
```

### 测试宏

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hashmap_macro() {
        let map = hashmap! {
            "a" => 1,
            "b" => 2,
        };
        assert_eq!(map.get("a"), Some(&1));
        assert_eq!(map.get("b"), Some(&2));
        assert_eq!(map.len(), 2);
    }

    #[test]
    fn test_empty_hashmap() {
        let map: std::collections::HashMap<&str, i32> = hashmap![];
        assert!(map.is_empty());
    }
}
```

---

## 性能考虑

### 编译时间

- 宏会增加编译时间，特别是复杂的过程宏
- 使用 `cargo build --timings` 分析编译时间

### 生成代码大小

- 避免生成过多重复代码
- 考虑使用泛型代替宏，减少代码膨胀

### 缓存和增量编译

- 过程宏的改变会导致依赖它的所有代码重新编译
- 将宏定义与实现分离到不同 crate

---

## 总结

Rust 的宏系统提供了强大的元编程能力：

| 宏类型 | 适用场景 | 复杂度 |
|--------|----------|--------|
| 声明宏 (`macro_rules!`) | 简单的代码生成和模式替换 | 低 |
| 派生宏 | 自动为类型实现 trait | 中 |
| 属性宏 | 增强或修改项的行为 | 中-高 |
| 函数式宏 | 自定义语法和 DSL | 高 |

选择建议：
- **简单重复代码** -> 声明宏
- **trait 实现** -> 派生宏
- **函数/结构体增强** -> 属性宏
- **自定义语法** -> 函数式宏

掌握 `syn` 和 `quote` 是编写过程宏的关键。通过组合这些工具，你可以创建强大的编译时代码生成工具，减少样板代码，提高开发效率。但也要注意不要过度使用宏，以免降低代码的可读性和可维护性。

---

## 参考资源

- [The Rust Programming Language - Macros](https://doc.rust-lang.org/book/ch19-06-macros.html)
- [The Little Book of Rust Macros](https://danielkeep.github.io/tlborm/book/)
- [syn 文档](https://docs.rs/syn/)
- [quote 文档](https://docs.rs/quote/)
- [Procedural Macros Workshop](https://github.com/dtolnay/proc-macro-workshop)
